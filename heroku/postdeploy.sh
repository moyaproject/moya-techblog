#!/bin/bash
moya db sync > /dev/null
moya auth#cmd.init --username $SUPER_USER --password $SUPER_PASSWORD --email $SUPER_EMAIL > /dev/null
moya techblog#cmd.init --force > /dev/null
