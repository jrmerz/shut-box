!function(a){"use strict";a.addEventListener("polymer-ready",function(){console.log("Polymer is ready to rock!")})}(wrap(document));var SB={};SB.dice=function(){function a(){return Math.floor(6*Math.random())+1}return{roll:a}}(),SB.game=function(a,b){function c(a){y.started||d(a)||(a=$.extend(!0,{},a),a.joined=!1,y.players.push(a),s("data-update",y))}function d(a){for(var b=0;b<y.players.length;b++)if(y.players[b].username==a.username)return!0;return!1}function e(a){for(var b=0;b<y.players.length;b++)y.players[b].username==a.username&&(y.players[b].joined=!0);s("data-update",y)}function f(a){if(!y.started){for(var b=0;b<y.players.length;b++)if(y.players[b].username==a)return void y.players.splice(b,1);s("data-update",y)}}function g(){y.turn.player=y.players[0],y.turn.dice1=SB.dice.roll(),y.turn.dice2=SB.dice.roll(),y.started=!0,s("data-update",y)}function h(){s("roll",{}),y.last.dice1=y.turn.dice1,y.last.dice2=y.turn.dice2,y.turn.dice1=SB.dice.roll(),y.turn.dice2=SB.dice.roll(),y.turn.roll++,0==y.inactive.length&&i(),l()||i()}function i(){for(var a=0,b=0;b<y.inactive.length;b++)a+=y.inactive[b];y.scores.length<=y.turn.index&&y.scores.push([]),y.scores[y.turn.index].push(a),j(),k()||(y.turn.index++,y.turn.index>=y.players.length&&(y.turn.index=0,y.round++),y.turn.player=y.players[y.turn.index],y.turn.roll=0,y.last.dice1=y.turn.dice1,y.last.dice2=y.turn.dice2,y.turn.dice1=SB.dice.roll(),y.turn.dice2=SB.dice.roll(),y.active=[],y.inactive=[1,2,3,4,5,6,7,8,9],s("data-update",y))}function j(){var a=0;arr=y.scores[y.turn.index];for(var b=0;b<arr.length;b++)a+=arr[b];a>y.maxScore&&p(y.players[y.turn.index])}function k(){if(y.out.length-2!=y.players.length)return!1;for(var a=0;a<y.players.length;a++)-1==y.out.indexOf(y.players[a].username)&&(y.winner=y.players[a]);return y.finished=!0,s("data-update",y.winner),!0}function l(){var a=y.turn.dice1+y.turn.dice2;if(y.inactive.indexOf(a)>-1)return!0;for(var b=0;b<y.inactive.length;b++)for(var c=b+1;c<y.inactive.length;c++)if(a==y.inactive[b]+y.inactive[c])return!0;return!1}function m(a,b){return o(a,b)?(n(a),n(b),h(),s("data-update",y),!0):!1}function n(a){void 0!==a&&(y.active.push(a),y.inactive.splice(y.inactive.indexOf(a),1),s("button-state-update",{active:y.active,inactive:y.inactive}))}function o(a,b){return a==y.turn.dice1+y.turn.dice2&&-1!=y.inactive.indexOf(a)?!0:a+b==y.turn.dice1+y.turn.dice2&&-1!=y.inactive.indexOf(a)&&-1!=y.inactive.indexOf(b)?!0:!1}function p(a){-1==y.out.indexOf(a.username)&&y.out.push(a.username),s("data-update",y)}function q(){return y}function r(a,b){if(b)return void(y=a);for(var c in a)y[c]=a[c];for(var c in y)void 0===a[c]&&delete y[c]}function s(a,b){if(z[a])for(var c=0;c<z[a].length;c++)z[a][c](b)}function t(a,b){z[a]?z[a].push(b):z[a]=[b]}function u(){return v()+v()+"-"+v()+"-"+v()+"-"+v()+"-"+v()+v()+v()}function v(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)}b||(b={});var w={maxScore:50};for(var x in w)b[x]||(b[x]=w[x]);var y={id:u(),created:new Date,maxScore:100,winner:null,out:[],round:0,players:[{username:a,joined:!0}],turn:{dice1:-1,dice2:-1,player:null,roll:0,index:0},last:{dice1:-1,dice2:-1},active:[],inactive:[1,2,3,4,5,6,7,8,9],scores:[],finished:!1,started:!1,options:b},z={};return{join:e,hasPlayer:d,addPlayer:c,removePlayer:f,getData:q,setData:r,setMove:m,start:g,on:t}};