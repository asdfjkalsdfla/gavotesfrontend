#!/bin/bash

aws s3 sync build/ s3://georgiavotesvisual/ --cache-control max-age=31536000
# aws s3 cp \
#        s3://georgiavotesvisual/ \
#        s3://georgiavotesvisual/ \
#        --exclude '*' \
#        --include '*.bin' \
#        --no-guess-mime-type \
#        --content-type="application/protobuf" \
#        --metadata-directive="REPLACE" \
#        --recursive
aws cloudfront create-invalidation --distribution-id EE4GWZ043VGRF --paths "/*"
# aws cloudfront create-invalidation --distribution-id EE4GWZ043VGRF --paths "/static/electionResultsSummary-2022*"
