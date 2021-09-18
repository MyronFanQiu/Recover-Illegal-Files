import axios, {AxiosInstance} from 'axios';
import logger from '../log';
import {parseObj} from '../util';

export enum RecoverRes {
  RecoverSuccess,
  RecoverUnavailable,
  RecoverFailed,
}

export default class SworkerApi {
  private readonly sworker: AxiosInstance;

  constructor(sworkerAddr: string, to: number) {
    this.sworker = axios.create({
      baseURL: sworkerAddr + '/api/v0',
      timeout: to,
      headers: {'Content-Type': 'application/json'},
    });
  }

  /// WRITE methods
  /**
   * Recover illegal files
   * @param cid ipfs cid
   * @returns Recover success or failed
   * @throws sWorker api error | timeout
   */
  async recoverFiles(data: any): Promise<RecoverRes> {
    try {
      const res = await this.sworker.post(
        '/file/recover_illegal',
        JSON.stringify(data)
      );

      logger.info(
        `  ↪ 💖  Call sWorker recover illegal, response: ${JSON.stringify(res.data)}`
      );

      if (res.status === 200) {
        return RecoverRes.RecoverSuccess;
      } else {
        return RecoverRes.RecoverFailed;
      }
    } catch (e: any) {
      // Axios error
      if (e.response) {
        const RecoverRes = e.response.data;
        if (RecoverRes && RecoverRes['status_code'] === 8014) {
          return RecoverRes.RecoverUnavailable;
        }
      }

      logger.error(`Recover illegal file ${data} error: ${e.toString()}`);
      return RecoverRes.RecoverFailed;
    }
  }

  /// READ methods
  /**
   * Fetch account
   * @returns free space size(GB)
   * @throws sWorker api error | timeout
   */
  async getAccount(): Promise<string> {
    try {
      const res = await this.sworker.get('/enclave/id_info');

      if (res && res.status === 200) {
        const body = parseObj(res.data);
        return body.account
      }

      return "";
    } catch (e) {
      logger.error(`Get free space from sWorker failed: ${e}`);
      return "";
    }
  }
}
