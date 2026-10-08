(() => {
  "use strict";

  const items = [
<!-- NAVIGATION:GENERATED:START -->
    {id:"about",label:"公司简介",menuLabel:"企业简介",targetId:"about-anchor",sectionId:"about"},
    {id:"position",label:"平台定位",menuLabel:"平台定位",targetId:"position-anchor",sectionId:"position"},
    {id:"value",label:"客户价值",menuLabel:"客户价值",targetId:"value-anchor",sectionId:"value"},
    {id:"ability",label:"平台能力",menuLabel:"平台能力",targetId:"ability-anchor",sectionId:"ability"},
    {id:"eco",label:"生态合作",menuLabel:"生态合作",targetId:"eco-anchor",sectionId:"eco"},
    {id:"contact",label:"合作",menuLabel:"合作",targetId:"contact-anchor",sectionId:"contact"}
<!-- NAVIGATION:GENERATED:END -->
  ];

  window.PetsNavigation = Object.freeze({
    items: items.map(item => Object.freeze({...item}))
  });
})();
