from __future__ import unicode_literals
from __future__ import print_function

import moya
from moya.compat import text_type

from requests_oauthlib import OAuth1Session


def get_credentials(provider, credentials):
    client_id = credentials.client_id or provider.get('client_id', None)
    client_secret = credentials.client_secret or provider.get('client_secret', None)
    return client_id, client_secret


@moya.expose.macro('get_oauth_resource_owner')
def get_oauth_resource_owner(app, provider, credentials):
    client_id, client_secret = get_credentials(provider, credentials)
    oauth = OAuth1Session(client_id, client_secret=client_secret)
    request_token_url = provider['request_token_url']
    response = oauth.fetch_request_token(request_token_url)

    resource_owner_key = response.get('oauth_token')
    resource_owner_secret = response.get('oauth_token_secret')

    result = {
        "key": resource_owner_key,
        "secret": resource_owner_secret
    }

    return result


@moya.expose.macro('get_oauth_authorize_url')
def get_oauth_authorize_url(app, provider, credentials):
    context = moya.pilot.context
    client_id, client_secret = get_credentials(provider, credentials)
    resource_owner_key = context['.session.oauth1.resource_owner.key']
    resource_owner_secret = context['.session.oauth1.resource_owner.secret']
    oauth = OAuth1Session(client_id,
                          client_secret=client_secret,
                          resource_owner_key=resource_owner_key,
                          resource_owner_secret=resource_owner_secret)

    authorization_url = oauth.authorization_url(provider['authorization_base_url'])
    return authorization_url


@moya.expose.macro('get_oauth_access_token')
def get_oauth_access_token(app, provider, credentials, verifier):
    context = moya.pilot.context
    client_id, client_secret = get_credentials(provider, credentials)
    resource_owner_key = context['.session.oauth1.resource_owner.key']
    resource_owner_secret = context['.session.oauth1.resource_owner.secret']
    oauth = OAuth1Session(client_id,
                          client_secret=client_secret,
                          resource_owner_key=resource_owner_key,
                          resource_owner_secret=resource_owner_secret,
                          verifier=verifier)
    access_token_url = provider['access_token_url']
    oauth_tokens = oauth.fetch_access_token(access_token_url)

    return oauth_tokens


@moya.expose.macro('get_oauth_profile')
def get_oauth_profile(app, provider, credentials, verifier):
    context = moya.pilot.context
    client_id, client_secret = get_credentials(provider, credentials)
    resource_owner_key = context['.session.oauth1.resource_owner.key']
    resource_owner_secret = context['.session.oauth1.resource_owner.secret']
    resources = provider.get('resources', {})
    session = OAuth1Session(client_id,
                            client_secret=client_secret,
                            resource_owner_key=resource_owner_key,
                            resource_owner_secret=resource_owner_secret,
                            verifier=verifier)

    access_token_url = provider['access_token_url']
    try:
        oauth_tokens = session.fetch_access_token(access_token_url)
    except Exception as e:
        app.throw('moya.logins.access-fail',
                  text_type(e))

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
