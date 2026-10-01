(() => {
  "use strict";
  const items = [
    {id:"about",label:"公司简介",menuLabel:"01 · 企业简介"},
    {id:"position",label:"平台定位",menuLabel:"02 · 平台定位"},
    {id:"value",label:"客户价值",menuLabel:"03 · 客户价值"},
    {id:"ability",label:"平台能力",menuLabel:"04 · 平台能力"},
    {id:"eco",label:"生态合作",menuLabel:"05 · 生态合作"},
    {id:"contact",label:"合作",menuLabel:"06 · 合作"}
  ];
  window.PetsNavigation = Object.freeze({items:items.slice()});
})();