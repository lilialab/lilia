#!/usr/bin/env bash
# 在 dsh-local 容器里、以仓库目录为 cwd 执行命令。
# ./dsh.sh                    进容器 bash
# ./dsh.sh pnpm dev:all
# ./dsh.sh pnpm exec prisma db seed
set -euo pipefail

container=dsh-local
workdir=/home/node/code/lilia
tty=(); [ -t 0 ] && [ -t 1 ] && tty=(-it)   # 管道/重定向时不加 -t

if [ $# -eq 0 ]; then
  exec docker exec "${tty[@]}" -w "$workdir" "$container" bash
fi
exec docker exec "${tty[@]}" -w "$workdir" "$container" "$@"
