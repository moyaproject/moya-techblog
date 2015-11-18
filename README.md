# Moya Tech Blog

Blog software for code and Photography. See [this blog post](https://www.willmcgugan.com/blog/tech/edit/moya-tech-blog/) for more details.

## Installing Moya

If you don't have moya installed, install it from the command line with:

    pip install moya

You may need 'sudo' on some platforms. If you have an older version of Moya, add the -U switch to upgrade.

You will also need the following for the 'Sign In' buttons.

    pip install requests_oauthlib

## Getting Started

To set up your blog for first use navigate to the /site/ directory and run the following:

    moya init

You can now run a development server with this command:

    moya runserver

Navigate to http://127.0.0.1:8000 to see your blog.

## Deploy to Heroku

<a href="https://heroku.com/deploy?template=https://github.com/moyaproject/moya-techblog">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

You can deploy directly to Heroku which will get you up and running with zero effort. Just click the button above.
