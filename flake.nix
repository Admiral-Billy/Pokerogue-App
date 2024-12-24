{
  description = "PokeRogue Desktop App";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.pokerogue-app = pkgs.callPackage ./release.nix {
          pname = "pokerogue-app";
          version = "2.4.6";
          src = ./.;
          npmDepsHash = "sha256-dQQ1SEZFNiIPFFFBtwDRYtHQzAzNxhYkwKzfNshKD08=";
          makeWrapper = pkgs.makeWrapper;
          stdenv = pkgs.stdenv;
        };

        # Add the desktop item to the pokerogue-app package
        defaultPackage.${system} = self.packages.${system}.pokerogue-app;

        # Add the desktop item as an app
        apps.pokerogue.${system} = {
          type = "app";
          program = "${self.packages.${system}.pokerogue-app}/bin/pokerogue";
        };
      }
    );
}
