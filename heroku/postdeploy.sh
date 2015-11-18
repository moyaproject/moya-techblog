#!/bin/bash
moya db sync
moya auth#cmd.init --username $SUPER_USER --password $SUPER_PASSWORD --email $SUPER_EMAIL
techblog#cmd.init --force
