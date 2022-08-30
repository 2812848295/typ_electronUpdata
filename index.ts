const admZip = require("adm-zip");
const request = require("request");
const fs = require("fs");
const path = require("path");
let baseUrl = path.resolve("./") + "/resources/";
import { app, ipcMain } from "electron";
const log = require("electron-log");
let system = "";
if (process.platform === "win32") {
  system = "Win";
} else if (process.platform === "linux") {
  system = "Linux";
} else {
  system = "Mac";
  baseUrl = path.join(__dirname, "../");
}

//let language = app.getLocale().toLowerCase();
//const fileUrl = `更新连接?`;
let version = app.getVersion();
/**
 * 
 * @param currVersion 更新连接tos?

Win：当前平台
5.0.13：当前版本号
zh-cn：当前系统语言
beta：写死0
 * @param remoteVersion 
 * @returns 
 */

/**
 *
 * @param currVersion 本地版本
 * @param remoteVersion 远程版本
 * @returns 是否存在可用更新
 */
const isAvailable = (currVersion: string, remoteVersion: string) => {
  const currVP = currVersion.split(".").map((v) => parseInt(v));
  const remoteVP = remoteVersion.split(".").map((v) => parseInt(v));
  if (currVP[0] > remoteVP[0]) {
    return false;
  } else if (currVP[0] == remoteVP[0]) {
    if (currVP[1] > remoteVP[1]) {
      return false;
    } else if (currVP[1] == remoteVP[1]) {
      return remoteVP[2] > currVP[2];
    } else {
      return true;
    }
  } else {
    return true;
  }
};
/**
 * 更新
 */
/**
 * .then((res: any) => { 
          fs.unlinkSync(`${baseUrl}app.zip`)
        });
 * @param downloadPath 
 * @returns 
 */
const downLoad = (downloadPath: string) => {
  return new Promise<boolean>((resolve, reject) => {
    // 创建一个可以写入的流，
    const stream = fs.createWriteStream(`${baseUrl}app.zip`); //创建流 打包过后的路径
    log.info(`${baseUrl}app.zip`);
    const url = downloadPath;
    request(url)
      .pipe(stream)
      .on("close", () => {
        const unzip = new admZip(`${baseUrl}app.zip`); //下载压缩更新包
        unzip.extractAllTo(`${baseUrl}`, true); //解压替换本地文件
        setTimeout(() => {
          fs.unlinkSync(`${baseUrl}app.zip`);
        }, 3000);
        resolve(true);
      });
  });
};

const checkForUpdates = () => {
  let language = app.getLocale().toLowerCase();
  const fileUrl = `xx`; //这里需要修改为自己的资源外网
  return new Promise((resolve, reject) => {
    request(
      {
        url: `${fileUrl}`, //请求package.json，与本地对比版本号
      },
      (error: any, res: any, body: any) => {
        const json = JSON.parse(body);
        try {
          if (json.code) {
            let downloadPath = json.data.path;
            let remotely = json.data.version; //服务器远程
            let flag = isAvailable(version, remotely);
            ipcMain.handle("exist_update", async (event, message) => {
              return await flag;
            });
            //ipc通信 确认更新下载
            ipcMain.handle("new_update", async (event, message) => {
              let flag = await downLoad(downloadPath);
              return flag;
            });
            ipcMain.on("Sure", (event, message) => {
              app.exit();
              app.relaunch();
            });
          } else {
            ipcMain.handle("exist_update", async (event, message) => {
              return await false;
            });
          }
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
export { downLoad, checkForUpdates };
