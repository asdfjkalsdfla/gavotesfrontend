aws s3 cp \
       s3://georgiavotesvisual/static \
       s3://georgiavotesvisual-latest/static \
       --exclude '*' \
       --include '*.json' \
       --exclude 'old/*' \
       --recursive \
       --dryrun
