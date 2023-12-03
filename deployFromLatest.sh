aws s3 sync s3://georgiavotesvisual-latest/assets s3://georgiavotesvisual/assets
aws s3 cp s3://georgiavotesvisual-latest/index.html s3://georgiavotesvisual/index.html
# aws s3 sync s3://georgiavotesvisual-latest/static s3://georgiavotesvisual/static
aws cloudfront create-invalidation --distribution-id EE4GWZ043VGRF --paths "/*"