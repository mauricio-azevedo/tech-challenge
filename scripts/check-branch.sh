#!/bin/sh
# O trabalho sai de develop, nunca direto nela, e a branch leva o tipo do commit no nome
# (PRACTICES.md > Branches). Este guard roda no pre-commit para impedir o deslize antes de ele virar historico.

if [ "${SKIP_BRANCH_CHECK:-0}" = "1" ]; then
  exit 0
fi

branch="$(git symbolic-ref --short -q HEAD)"

# HEAD destacada (rebase, bisect): o commit nao pertence a uma branch ainda, nao ha o que validar.
if [ -z "$branch" ]; then
  exit 0
fi

case "$branch" in
  develop | main | master)
    echo "commit direto em '$branch' nao e permitido; crie uma branch, ex.: git checkout -b feat/minha-mudanca" >&2
    exit 1
    ;;
esac

pattern='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)/[a-z0-9]+(-[a-z0-9]+)*$'
if ! printf '%s' "$branch" | grep -Eq "$pattern"; then
  echo "nome de branch invalido: '$branch'; use <tipo>/<descricao-em-kebab-case>, ex.: fix/status-nao-atualiza" >&2
  exit 1
fi
