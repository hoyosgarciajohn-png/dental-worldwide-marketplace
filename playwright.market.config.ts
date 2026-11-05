import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:/market-.*\.spec\.ts/,timeout:60000,fullyParallel:false,workers:1,retries:0,reporter:'line',use:{baseURL:'http://127.0.0.1:3000',trace:'off',screenshot:'off',video:'off'},projects:[
{name:'chromium-1440',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
{name:'chromium-768',use:{browserName:'chromium',viewport:{width:768,height:1024}}},
{name:'chromium-360',use:{browserName:'chromium',viewport:{width:360,height:800},isMobile:true,hasTouch:true}},
{name:'firefox-1440',use:{browserName:'firefox',viewport:{width:1440,height:1000}}},
{name:'webkit-360',use:{browserName:'webkit',viewport:{width:360,height:800},isMobile:true,hasTouch:true}}
]});
