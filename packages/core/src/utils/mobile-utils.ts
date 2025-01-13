//判断是否是微信
export const isWechatApp = /micromessenger/.test(navigator.userAgent.toLowerCase());

//判断当前网络是链接私有wifi 还是链接通信供应商的无线网络
export const isNotWifi = () => {
  const navigator: any = window.navigator;
  const con = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (isWechatApp) {
    if (navigator.userAgent.indexOf('WIFI') < 0) {
      return true;
    }
  } else if (con) {
    const network = con.effectiveType || con.type;
    if (network && network !== 'wifi' && network !== '2') {
      return true;
    }
  }
  return false;
};

export const isMobileDevice =
  /Android|webOS|iPhone|BlackBerry|IEMobile|Opera Mini|iPad|HuaweiBrowser/i.test(
    navigator.userAgent,
  );

//判断宽度,是pc还是h5
export const isMobileDeviceWidth = () => {
  try {
    const clientWidth = document.documentElement.clientWidth;
    return !clientWidth || (clientWidth < 768 && clientWidth >= 320);
  } catch (e) {
    return true;
  }
};
//判断是不是支付宝
export const isAliPay = /alipay/.test(navigator.userAgent.toLowerCase());

export const isMyStarDevice = /MyStar/i.test(navigator.userAgent);

//判断是不是安卓系统
export const isAndroid = /Android/i.test(navigator.userAgent);
//判断是不是鸿蒙系统
export const isHarmonyOS = /HuaweiBrowser/i.test(navigator.userAgent);
// 是否企业微信
export const isWeCom = /wxwork/i.test(navigator.userAgent);
// 判断是否IOS
export const isIOS = /\(i[^;]+;( U;)? CPU.+Mac OS X/i.test(navigator.userAgent);
