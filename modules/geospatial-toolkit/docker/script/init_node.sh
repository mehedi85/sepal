#!/bin/bash
set -e

echo
echo "**************************"
echo "*** Installing Node.js ***"
echo "**************************"

curl -sL https://deb.nodesource.com/setup_14.x | bash -
apt-get install -y nodejs
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt-get update && apt-get -y install yarn
npm install -g @google/earthengine@0.1.234
