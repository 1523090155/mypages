function FindProxyForURL(url, host) {
    var proxy = "PROXY 192.168.3.50:10809";
    var direct = "DIRECT";

    if (isResolvable("192.168.3.50")) {
        return proxy;
    }

    return direct;
}
