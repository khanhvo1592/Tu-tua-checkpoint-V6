const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
 let listener,button,reply;
 const source={postMessage(x){reply=x}};
 const w={addEventListener(t,fn){listener=fn},removeEventListener(){}};
 const frame={contentWindow:source,closest(){return {id:'video_demo'}}};
 const d={readyState:'complete',scripts:[],body:{appendChild(x){button=x}},createElement(tag){return tag==='button'?{style:{}}:{set innerHTML(x){this.value=x}}},querySelector(s){return s.startsWith('[data-block-type="video"]')?{}:null},querySelectorAll(s){return s==='iframe'?[frame]:[]}};
 await vm.runInNewContext(fs.readFileSync('outputs/tu-tua-checkpoint-V6.user.js','utf8'),{window:w,top:w,document:d,location:{origin:'https://binhdanhocvuso.gov.vn',href:'https://binhdanhocvuso.gov.vn/test'},fetch:async()=>({ok:true,text:async()=>'<html></html>'}),console:{log(){},warn(){},error(){},table(){}},getComputedStyle:()=>({visibility:'visible'})});
 const event={origin:'https://www.youtube.com',source,data:{type:'VIDEO_CHECKPOINT_V6',action:'poll',token:'t'}};
 listener(event);assert.equal(reply.points.length,0);
 button.onclick();listener(event);assert.equal(reply.points,null);
 button.onclick();listener(event);assert.equal(reply.points.length,0);
 reply=null;listener({...event,origin:'https://example.org'});assert.equal(reply,null);
 console.log('PASS: kết nối frame, bật/tắt/bật lại, từ chối origin không hợp lệ.');
})();
