from __future__ import unicode_literals
from __future__ import print_function

import moya
from moya.compat import text_type

from oauthlib.oauth2 import InsecureTransportError
from requests_oauthlib import OAuth2Session


def get_credentials(provider, credentials):
    client_id = credentials.client_id or provider.get('client_id', None)
    client_secret = credentials.client_secret or provider.get('client_secret', None)
    return client_id, client_secret


@moya.expose.macro('get_oauth2_session')
def get_oauth2_session(app, provider, credentials, redirect_uri):
    client_id, client_secret = get_credentials(provider, credentials)
    scope = provider.get('scope', [])
    session = OAuth2Session(client_id,
                            scope=scope,
                            redirect_uri=redirect_uri)
    authorization_url, state = session.authorization_url(provider['authorization_base_url'])
    state = {
        'authorization_url': authorization_url,
        'state': state
    }
    return state


@moya.expose.macro('fetch_oauth2_token')
def fetch_oauth2_token(app, provider, credentials, redirect_uri):
    client_id, client_secret = get_credentials(provider, credentials)
    context = moya.pilot.context
    session = OAuth2Session(client_id,
                            state=context['.session.oauth2.state'],
                            redirect_uri=redirect_uri)
    try:
        token = session.fetch_token(provider['token_url'],
                                    client_secret=client_secret,
                                    authorization_response=context['.request.url'])
    except InsecureTransportError as e:
        moya.pilot.throw('moya.logins.insecure-transport',
                         text_type(e),
                         diagnosis="You can disable the requirement for SSL during development with the following:\n\n**export OAUTHLIB_INSECURE_TRANSPORT=1**")
    except Exception as e:
        moya.pilot.throw('moya.logins.fail',
                         "failed to fetch oauth2 token ({})".format(e))
    return token


@moya.expose.macro('get_oauth2_profile')
def get_oauth2_profile(app, provider, credentials, token):
    client_id, secret_id = get_credentials(provider, credentials)
    context = moya.pilot.context
    scope = provider.get('scope', [])
    resources = provider.get('resources', {})
    session = OAuth2Session(client_id,
                            scope=scope,
                            token=token)

    info = {}
    for scope, scope_url in sorted(resources.items()):
        try:
            response = session.get(scope_url)
        except Exception as e:
            app.throw('moya.logins.get-scope-fail',
                      text_type(e),
                      diagnosis="There may be a connectivity issue getting scope information.",
                      scope=scope,
                      scope_url=scope_url)
        try:
            info[scope] = scope_data = response.json()
            #if(context['.debug']):
            #    context['.console'].obj(context, scope_data)
        except:
            pass

    provider_profile = provider.get('profile', {})
    profile = {}
    context['_oauth_info'] = info
    with context.frame('_oauth_info'):
        for k, v in provider_profile.items():
            try:
                profile[k] = context.eval(v)
            except:
                pass

    return {'profile': profile, 'info': info}
