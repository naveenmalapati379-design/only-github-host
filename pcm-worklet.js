class ClearCuePCM extends AudioWorkletProcessor {
 constructor(){super();this.buffer=new Float32Array(2048);this.offset=0;}
 process(inputs){const channels=inputs[0];if(!channels?.length)return true;const n=channels[0].length;for(let i=0;i<n;i++){let value=0;for(const c of channels)value+=c[i];this.buffer[this.offset++]=value/channels.length;if(this.offset===this.buffer.length){this.port.postMessage(this.buffer);this.buffer=new Float32Array(2048);this.offset=0;}}return true;}
}
registerProcessor('clearcue-pcm',ClearCuePCM);
