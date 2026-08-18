{
  description = "Node.js 24 with pnpm development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          name = "node24-pnpm";
          buildInputs = with pkgs; [
            nodejs_24
            pnpm
            openssl
            prisma-engines
          ];

          shellHook = ''
            echo "欢迎进入 Node.js 24 + pnpm 开发环境！"
            echo "Node version: $(node -v)"
            echo "PNPM version: $(pnpm -v)"
          '';
        };
      });
}