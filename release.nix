{ lib
, buildNpmPackage
, makeWrapper
, stdenv
, pname
, version
, src
, npmDepsHash
, electron
}:

buildNpmPackage rec {
  inherit pname version src npmDepsHash;

  forceGitDeps = true;

  env = {
    ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
    NIXOS_OZONE_WL = 1;
  };

  dontNpmBuild = true;
  NODE_OPTIONS = "--openssl-legacy-provider";

  buildInputs = [ electron ];

  preConfigure = ''
    export NO_UPDATE_NOTIFIER="1"
    export ELECTRON_SKIP_BINARY_DOWNLOAD=1
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/bin"
    mkdir -p "$out/share/applications"
    mkdir -p "$out/share/icons/hicolor/512x512/apps"

    cp -r ./* "$out/bin/"
    cp "$out/bin/type-chart.png" "$out/bin/src/typechart.png"
    cp "$out/bin/type-chart-2.png" "$out/bin/src/typechart-2.png"
    cp "$out/bin/icons/PR.png" "$out/share/icons/hicolor/512x512/apps/PR.png"

    # Create an executable wrapper
    makeWrapper ${electron}/bin/electron "$out/bin/pokerogue" \
      --add-flags "$out/bin/src/main.js" \
      --add-flags "\''${NIXOS_OZONE_WL:+\''${WAYLAND_DISPLAY:+--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations}}" \
      --inherit-argv0

    cat > "$out/share/applications/pokerogue-app.desktop" <<EOF
    [Desktop Entry]
    Name=Pokerogue
    Exec=$out/bin/pokerogue
    Icon=$out/share/icons/hicolor/512x512/apps/PR.png
    Type=Application
    Comment=Desktop app for the Pokerogue web game
    Categories=Game;
    EOF
  '';

  meta = with lib; {
    description = "Desktop app for the Pokerogue web game";
    homepage = "https://github.com/Admiral-Billy/Pokerogue-App";
    license = licenses.mit;
    maintainers = with maintainers; [];
    platforms = platforms.linux;
  };
}
