const AUTH: number = 0x115f;
const PATH = "assets/server/";

export class Server {
  /**
   * Get a file
   * @param  {String}  filename   The file to get
   * @param  {Boolean} isJson     Is the file JSON?
   * @return {Promise}            Promise for fetching file
   */
  public static async getFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let http: XMLHttpRequest = new XMLHttpRequest();
      http.open('POST', PATH + 'getFile.php');
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.onload = (): void => {
        if (http.response.match(/E[0-9]{3}/)) {
          reject(http.response);
        } else {
          resolve(http.response);
        }
      };
      http.send("auth=" + AUTH + "&filename=" + filename);
    });
  }

  /**
   * Put contents in a file
   * @param  {String}  filename   The file to insert in to
   * @param  {String}  contents   The contents
   * @return {Promise}            Promise for putting file
   */
  public static async putFile(filename: string, contents: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let http: XMLHttpRequest = new XMLHttpRequest();
      http.open('POST', PATH + 'putFile.php');
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.onload = (): void => {
        if (http.response.match(/E[0-9]{3}/)) {
          reject(http.response);
        } else {
          resolve(http.response);
        }
      };
      http.send("auth=" + AUTH + "&filename=" + filename + "&contents=" + contents);
    });
  }

  /**
   * Create a file
   * @param  {String}  filename       The file to create
   * @param  {String}  [contents='']  The contents to insert
   * @return {Promise}                Promise for creating file
   */
  public static async createFile(filename: string, contents: string = ''): Promise<void> {
    return new Promise((resolve, reject) => {
      let http: XMLHttpRequest = new XMLHttpRequest();
      http.open('POST', PATH + 'createFile.php');
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.onload = (): void => {
        if (http.response.match(/E[0-9]{3}/)) {
          reject(http.response);
        } else {
          resolve(http.response);
        }
      };
      http.send("auth=" + AUTH + "&filename=" + filename + "&contents=" + contents);
    });
  }

  /**
   * Delete a file
   * @param  {String}  filename       The file to delete
   * @return {Promise}                Promise for deleting file
   */
  public static async deleteFile(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let http: XMLHttpRequest = new XMLHttpRequest();
      http.open('POST', PATH + 'deleteFile.php');
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.onload = (): void => {
        if (http.response.match(/E[0-9]{3}/)) {
          reject(http.response);
        } else {
          resolve(http.response);
        }
      };
      http.send("auth=" + AUTH + "&filename=" + filename);
    });
  }

  /**
   * Get array of files in bin/
   * @param  {String} type        Filetype to scan for
   * @return {Promise}            Promise for fetching file
   */
  static async getFiles(type: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let http: XMLHttpRequest = new XMLHttpRequest();
      http.open('POST', PATH + 'getFiles.php');
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.onload = (): void => {
        if (http.response.match(/E[0-9]{3}/)) {
          reject(http.response);
        } else {
          let files: string[] = JSON.parse(http.response);
          resolve(files);
        }
      };
      http.send("auth=" + AUTH + "&filetype=" + type);
    });
  }
}

export default Server;