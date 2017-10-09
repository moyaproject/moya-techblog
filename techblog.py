# encoding=UTF-8
from __future__ import unicode_literals

import sys

import moya
from moya.wsgi import Application
from moya.command.app import main

application = Application('./', ['local.ini', 'production.ini'], server='main', logging='prodlogging.ini')
