(() => {
  "use strict";
  const items = [
    {id:"about",label:"公司简介",menuLabel:"公司简介"},
    {id:"position",label:"平台定位",menuLabel:"平台定位"},
    {id:"ability",label:"平台能力",menuLabel:"平台能力"},
    {id:"chain",label:"打通全链",menuLabel:"一个平台 · 打通全链"},
    {id:"eco",label:"生态合作",menuLabel:"生态合作"},
    {id:"value",label:"客户价值",menuLabel:"客户价值"},
    {id:"scenes",label:"核心场景",menuLabel:"核心业务场景"},
    {id:"contact",label:"合作",menuLabel:"合作"}
  ];
  window.PetsNavigation = Object.freeze({items:items.slice()});
})();