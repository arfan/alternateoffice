#!/bin/sh
# deb/rpm post-install: expose the alternateoffice command line shipped inside the app.
# Only an absent name, a dead link or a link into our own install dir is taken
# over; anything else at /usr/bin/alternateoffice belongs to another program (alternateoffice#893).
set -e
launcher="/opt/AlternateOffice/resources/cli/alternateoffice"
link="/usr/bin/alternateoffice"
[ -x "$launcher" ] || exit 0
if [ -L "$link" ]; then
  case "$(readlink "$link")" in
    /opt/AlternateOffice/*) ;;
    *) [ -e "$link" ] && { echo "alternateoffice: $link is another program, left as is; run: ln -s $launcher $link" >&2; exit 0; } ;;
  esac
elif [ -e "$link" ]; then
  echo "alternateoffice: $link is another program, left as is; run: ln -s $launcher $link" >&2
  exit 0
fi
ln -sfn "$launcher" "$link"
exit 0
