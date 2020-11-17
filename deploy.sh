#!/bin/bash

aws s3 sync build/ s3://georgiavotesvisual/
aws cloudfront create-invalidation --distribution-id EE4GWZ043VGRF --paths "/*"