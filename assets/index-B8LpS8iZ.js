import{effectScope as l,ref as a,markRaw as p,resolveComponent as f,createBlock as d,openBlock as m,createApp as h}from"vue";(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function c(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=c(e);fetch(e.href,t)}})();/*!
 * pinia v2.3.1
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */const _=Symbol();var i;(function(r){r.direct="direct",r.patchObject="patch object",r.patchFunction="patch function"})(i||(i={}));function g(){const r=l(!0),n=r.run(()=>a({}));let c=[],o=[];const e=p({install(t){e._a=t,t.provide(_,e),t.config.globalProperties.$pinia=e,o.forEach(s=>c.push(s)),o=[]},use(t){return this._a?c.push(t):o.push(t),this},_p:c,_a:null,_e:r,_s:new Map,state:n});return e}const y={__name:"App",setup(r){return(n,c)=>{const o=f("router-view");return m(),d(o)}}};console.log("GitHub Token:","未设置");console.log("Other Secret:","未设置");const u=h(y),b=g();u.use(b);u.mount("#app");
