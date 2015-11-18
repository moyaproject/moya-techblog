#!/bin/bash
moya db sync > postdeploy.txt
moya auth#cmd.init --username $SUPER_USER --password $SUPER_PASSWORD --email $SUPER_EMAIL > postdeploy.txt
moya techblog#cmd.init --force > postdeploy.txt
