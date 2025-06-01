# The purpose of this file is to make sure `x-data.sql` is only ran when while developing
set -e

if [[ "$DEV_MODE" == "true" ]]; then
  echo "Creating development example data"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < /docker-entrypoint-initdb.d/dev/x-data.sql
fi
