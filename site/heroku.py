# encoding=UTF-8
from __future__ import unicode_literals
from moya.wsgi import Application

application = Application('./', ['production.ini'], server='main', logging='herokulogging.ini')
