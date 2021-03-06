#!/usr/bin/env bash

LIBS=../../../lib/js
NODE_TLS_REJECT_UNAUTHORIZED=0 nodemon \
    --watch src \
    --watch $LIBS/shared \
    --inspect=0.0.0.0:9228 \
    --exec npm run test
    # src/main.js \
    # --gee-email google-earth-engine@openforis-sepal.iam.gserviceaccount.com \
    # --gee-key-path $SEPAL_CONFIG/google-earth-engine/gee-service-account.pem \
    # --sepal-host localhost:3000 \
    # --sepal-username 'sepalAdmin' \
    # --sepal-password 'the admin password' \
    # --home-dir $SEPAL_CONFIG/sepal-server/home/admin \
    # --username admin
