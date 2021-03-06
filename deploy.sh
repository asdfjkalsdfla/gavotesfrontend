#!/bin/bash

aws s3 sync build/ s3://georgiavotesvisual/
aws s3 cp \
       s3://georgiavotesvisual/ \
       s3://georgiavotesvisual/ \
       --exclude '*' \
       --include '*.bin' \
       --no-guess-mime-type \
       --content-type="application/protobuf" \
       --metadata-directive="REPLACE" \
       --recursive
aws cloudfront create-invalidation --distribution-id EE4GWZ043VGRF --paths "/*"