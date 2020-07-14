//badyun的代码
//代码来源 https://www.52pojie.cn/forum.php?mod=viewthread&tid=1217774&extra=page%3D1%26filter%3Dauthor%26orderby%3Ddateline
//




const exec = require('child_process').exec;
const superagent = require('superagent');
const fs = require('fs');
const glob = require("glob");
 
 
 
 
 
 
 
 
 
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
//////////////改成自己的视频路径
const videoDir = './aaa.mp4';//视频路径












const tsDir = './tmp/';//切片及m3u8文件存储路径
const size = 2;//视频切片大小，数字越大单个切片时常越长体积越大，掘金图传限制最大图片大小为10M
const content = `ffmpeg -i ${videoDir} -c copy -map 0 -f segment -segment_list ${tsDir}index.m3u8 -segment_time ${size} ${tsDir}%03d.ts`;//切片命令
 
// 调用shell脚本方法
async function shell(content) {
    return new Promise((resolve, reject) => {
        exec(content, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(stdout)
            }
        });
    })
}
 
// 上传到掘金方法（频繁重传）
async function upload(path) {
    try {
        let s = await superagent.post('https://cdn-ms.juejin.im/v1/upload')
            .query({
                bucket: "gold-user-assets"
            })
            .attach('file', path, '1.png')
        let url = s.body.d.url.https
        console.log(url)
        return url
    } catch (error) {
        // 出错表示掘金上传频繁拒绝了，暂停3秒继续请求
		console.log(error)
		setTimeout(()=>
		{
			return upload(path)
		}, 3000)
        
    }
}
 
 
(async () => {
    // 进行视频切片
    console.log('开始视频切片')
    await shell(content);
    console.log('视频切片完成')
 
    // 获取到切片列表
    let tsList = glob.sync(`${tsDir}*.ts`);
 
    // 获取到m3u8实体内容
    let m3u8Content = fs.readFileSync(`${tsDir}index.m3u8`).toString();
    // console.log(m3u8Content)
 
    console.log('开始上传切片')
    // 上传切片
    for (let index in tsList) {
        let ele = tsList[index]
        let tsName = ele.split('/')[ele.split('/').length - 1]
        // 执行上传
        let url = await upload(ele)
 
        // 获取到上传地址后替换原版的地址
        m3u8Content = m3u8Content.replace(tsName, url)
 
        // 删除已上传的ts
        fs.unlinkSync(ele)
        console.log(`上传成功，当前上传进度：${parseInt(index) + 1}/${tsList.length}`)
        console.log('==============================')
 
    }
    console.log('切片上传完成')
 
    // 获取到所有地址后，将新地址写出并同步上传到掘金
    fs.writeFileSync(`${tsDir}main.m3u8`, m3u8Content);
    let m3u8Url = await upload(`${tsDir}main.m3u8`)
    console.log('m3u8文件上传成功')
 
    // 构造在线播放地址
    //let playUrl = "";
    console.log('==============================')
 
    // 清空文件缓存
    fs.unlinkSync(`${tsDir}index.m3u8`)
    fs.unlinkSync(`${tsDir}main.m3u8`)
 
    console.log(`m3u8在线链接：${m3u8Url}`)
    console.log(`视频在线播放器地址：${playUrl}`)
	
	// 将视频链接存到本地,免得不小心关闭控制框就完了
	let nTime = new Date().getTime() + "";
	let strTime = nTime.slice(nTime.length-8);
	fs.writeFileSync(`./result/` + videoDir + strTime +".txt", "m3u8在线链接：" + m3u8Url);
})()