import * as fs from "fs";

if (!process.argv[2]) {
    console.log("引数が　ないよ　！")
    setTimeout(() => {
        process.exit();
    }, 2000);
} else {
    const inputCode: string = fs.readFileSync(process.argv[2]).toString();
    /**
     * 実際の要素の形式
     * オブジェクトもしくはstring,numberが代入されるであろう。
     * 内部に代入されるオブジェクトはどうなるか予想もつかないため、現状ではanyとする。
     */

    /**
     * anyをすべて廃止可能な型モデル
     * セキュアにしたいならこうするしかないよねぇ！？
     */
    type newvaluetype = {
        value: [string, (string | number | boolean)][],
        obj: newvaluetype[],
        name: string,
        comment?: string[]
    }

    /**
     * IDのマッピング用
     */
    type idmap = { id: string, x: number, y: number }
    /**
    * 雑多なツール郡。
    * 多すぎて邪魔だからクラス化した。
    */
    class tools {
        static shitlikeerror() {
            console.log("ふざけたエラーです")
            process.exit();
        }
        static sortObjectByKey(obj: any, targetKey: string) {
            // 1. オブジェクトをエントリーの配列に変換
            const entries = Object.entries(obj);

            // 2. キーが指定したキーと一致するかどうかでソート
            entries.sort(([keyA], [keyB]) => {
                if (keyA === targetKey) {
                    return -1; // keyAがtargetKeyならkeyAを先頭に
                } else if (keyB === targetKey) {
                    return 1; // keyBがtargetKeyならkeyBを先頭に
                } else {
                    return keyA.localeCompare(keyB); // それ以外は通常のソート
                }
            });

            // 3. ソートしたエントリーの配列から新しいオブジェクトを作成
            const sortedObject = Object.fromEntries(entries);

            return sortedObject;
        }

        static isnest(str: string) {
            if (str.indexOf("= {") !== -1 && str.indexOf("#") === -1) return true; else return false;
        }
        static isNumber(value: any): boolean {
            return !Number.isNaN(parseInt(value));
        }
        /**
         * インデントやスペースを取り除き、キーと値で分割する。
         * @param element 変換したい文字列
         * @returns 分割後
         */
        static splitandtrim(element: string): string[] {
            return element.replace(/^(\s+)/, '').replace(" ", "").replace(/\r/g, '').split("=");//インデントを削除 + =で分割
        }
    }
    /**
     * Focusブロックを文字列から探し出し、その部分からいい感じに文字列をぶっこ抜く
     * コメントの保持に関してはオブジェクトの上に規定
     * 基本的には値を保持するためのもろもろからいい感じにする
     * 将来的には値の不順をどうにかしたい。
     * 
     * @param str 
     */

    function converter(str: string) {
        /**
         * ブロック内部に存在している要素を検出し、いい感じにオブジェクトとして返す
         * @param str 検索元文字列
         * @param indexcounter 文字列の何行目を参照するか？
         * @returns そのブロック内のオブジェクト。
         * ただしブロックの真上に書いたコメントをどう処理するかは不明。
         * （規定）あくしろよ
         */
        function findblock(str: string[], indexcounter: number, nestname: string): [newvaluetype, number] | undefined {
            //  console.log("trigger")
            let buffer: newvaluetype = {
                value: [],
                obj: [],
                name: nestname,
                comment: []
            };
            for (let index = indexcounter; index < str.length; index++) {
                const element = str[index];
                if (element.indexOf("}") !== -1 && element.indexOf("#") === -1) {//閉じブロックがあった場合
                    return [buffer, index];//そこまでの要素を返す
                }
                if (!tools.isnest(element) && element.indexOf("#") === -1) {//ブロック以外                        
                    const splitelem = tools.splitandtrim(element);
                    if (tools.isNumber(splitelem[1])) {
                        buffer.value.push([splitelem[0], Number(splitelem[1])]);
                    } else {
                        if (splitelem[0] !== "") {//空白でなければ
                            //   buffer[splitelem[0]] = splitelem[1];
                            buffer.value.push([splitelem[0], splitelem[1]])
                        }
                    }
                } else {//ブロックの場合
                    if (element.indexOf("#") === -1) {
                        const nestname = tools.splitandtrim(element)[0];
                        const elem = findblock(str, index + 1, nestname);
                        if (elem !== undefined) {
                            index = elem[1];
                            if (Object.keys(elem[0]).length !== 0) {
                                //要修正
                                buffer.obj.push(elem[0]);//再帰した後ブロックを追加
                            } else {
                                buffer.obj.push(elem[0]);
                            }

                        } else {

                            tools.shitlikeerror();
                        }
                    }


                }
            }
            return [buffer, -1]
        }
        /**
         * 
         * 改行で配列に分割
         */
        const target = str.split("\n");
        //返り値
        let resultbuffer: newvaluetype[] = [];
        for (let index = 0; index < target.length; index++) {
            const element = target[index];
            if (element.indexOf("= {") === -1 && element.indexOf("#") === -1) {//focusではない場合
                //focusブロック以外の場合の値出力とコメントを書く   
            } else {//focusブロックを発見した場合
                if (element.indexOf("#") === -1) {
                    const buffer = findblock(target, index + 1, "focus");//ブロック開始の行
                    // console.log(buffer);
                    // process.exit()
                    if (!buffer) {
                        console.log("???")
                        tools.shitlikeerror()
                    } else {
                        resultbuffer.push(buffer[0]);//一旦コメントは無視
                        index = buffer[1];
                    }
                }

            }
        }//閉じfor
        return resultbuffer;



    }
    /**
     * 子要素をマイニングし呼び出し元を特定、相対座標をわりだす
     * 検索元にprerequisiteが複数あることを前提に考えるべき
     * @param parent 検証したい親要素
     * @param base 検索元のデーターベース
     */
    function miningchildrenandedit(parent: newvaluetype[], base: newvaluetype[], iddata: idmap[]): newvaluetype[] {

        type relative = {
            x: number,
            y: number,
            relative_position_id: string;
        }
        /**
         * 前提NFが存在するか？
         * @param obj 検証したい要素[]
         * @returns 
         */
        /**
         * 親要素との差から相対位置を割り出す
         * @param cobj 子objの座標
         * @param pobj 親objの座標
         * 
         */
        function childrelative(cobj: { x: number, y: number }, pobj: { x: number, y: number }): { x: number, y: number } {
            const resultx = cobj.x - pobj.x;
            const resulty = cobj.y - pobj.y;
            return { x: resultx, y: resulty };
        }
        /**
         * IDのDBに座標照会をする
         * @param targetid 
         * @param iddata 
         * @returns nullは存在しないとき
         */
        function getcordbyid(targetid: string, iddata: idmap[]): idmap | null {
            let returnbuff: idmap | null = null;
            let flag = false;
            //  console.log(targetid);
            iddata.map(elem => {
                //      console.log(elem.id)
                if (elem.id.replace(" ", "") === targetid.replace(" ", "")) {
                    returnbuff = elem
                }
            })
            return returnbuff;
        }
        function getcoordinate(obj: newvaluetype): [number, number] {

            let result: number[] = [];
            obj.value.map((elem) => {
                if (elem[0] === "x") {
                    result[0] = Number(elem[1]);
                }
                if (elem[0] === "y") {
                    result[1] = Number(elem[1]);
                }
            })
            return [result[0], result[1]]


        }
        /**
         * 指定された名前の要素を虹配列から取り出す
         * @param obj オブジェくと
         * @param target ターゲットの名前
         * @returns 虹配列
         */
        function getvalue(obj: newvaluetype, target: string) {
            let result: [string, (string | number | boolean)][] = []
            obj.value.map((elem) => {
                if (elem[0] === target) {
                    result.push(elem);
                }
            });
            return result;
        }
        /**
         * objからtargetの位置を割り出す
         * @param obj ターゲットobj
         * @param target 探したいプロパティ
         * @returns index
         */
        function findindex(obj: newvaluetype, target: string) {
            let result: number[] = []
            obj.value.map((elem, index) => {
                if (elem[0] === target) {
                    result.push(index);
                }
            })
            return result;
        }

        function getid(base: newvaluetype): string {
            let result = "";

            base.value.map(elem => {
                //      console.log(elem)
                if (elem[0] === "id") {

                    result = elem[1].toString();
                }
            })

            return result;
        }
        /**
         * xとyを指定されたobjから取り出す
         * @param obj 
         */


        /**
         * 
         * @param parentcoordinate 親座標
         * @param parentid 親ID
         * @param obj 現時点のデータ
         */
        function searchchildandedit(parentcoordinate: { x: number, y: number }, parentid: string, obj: newvaluetype[], iddata: idmap[], callbackcounter?: number): newvaluetype[] {
            console.log("呼び出し");
            console.log(obj);
            if (callbackcounter && callbackcounter > 100) {
                console.log("callstuckが溢れてやがる！");
                console.log(parentid);
                process.exit();
            }
            console.log(parentcoordinate)
            // let resultbuffervalue = obj.value;
            // let resultbuffer = obj.obj;
            let nexyparents: { parentcoordinate: { x: number, y: number }, parentid: string }[] = [];
            let objbuffer = obj.map((elemtop) => {

                let result: newvaluetype = elemtop;
                /**
                 * 子要素の座標
                 */

                const coordinatebuffer = getcoordinate(elemtop);

                const ccoordinate = { x: coordinatebuffer[0], y: coordinatebuffer[1] };
                // const ishaveprerequisite = isprerequisite(cobg);
                // if (ishaveprerequisite) {//前提NFが存在すれば
                // }
                elemtop.obj.map((elem, index) => {//要素内の要素配列の前提項目の確認＆書き換え    
                    //  console.log(elem)
                    if (elem.name === "prerequisite") {//前提NFであるobjがobj[]内に存在した場合
                        elem.value.map((elem2) => {//子要素の内のvalueを取り出す
                            if (elem2[1].toString() === parentid) {//親要素を指定していた要素だった場合
                                let backupcord: number[] = [];
                                if (getvalue(elemtop, "relative_position_id").length === 0) {//すでにrelactiveが存在しないか？
                                    //要素をeditし、返り値を仕込む
                                    const relative_position = childrelative(ccoordinate, parentcoordinate);
                                    result.value.push(["default_cord", parentcoordinate.x + ":" + parentcoordinate.y]);
                                    result.value.push(["relative_position_id", parentid]);
                                    const position = [findindex(result, "x")[0], findindex(result, "y")[0]];
                                    backupcord = [Number(result.value[Number(position[0])][1]), Number(result.value[Number(position[1])][1])]
                                    result.value[Number(position[0])][1] = relative_position.x
                                    result.value[Number(position[1])][1] = relative_position.y
                                }//elseはスキップ
                                const position = [findindex(result, "x")[0], findindex(result, "y")[0]];
                                const basecoordinatex: number = Number(result.value[Number(position[0])][1]);
                                const basecoordinatey: number = Number(result.value[Number(position[1])][1]);
                                const pcord = getcordbyid(getid(elemtop), iddata);
                                if (pcord) {
                                    nexyparents.push({ parentcoordinate: { x: pcord.x, y: pcord.y }, parentid: getvalue(elemtop, "id")[0][1].toString() });
                                }
                            }

                        })

                    }
                })
                return result;
            })
            if (nexyparents.length !== 0) {
                nexyparents.map((elem) => {
                    let callbackcounterbuffer: number = 0;
                    if (callbackcounter) {
                        callbackcounterbuffer = callbackcounter;
                    }

                    const resultnextedit = searchchildandedit(elem.parentcoordinate, elem.parentid, objbuffer, iddata, callbackcounterbuffer + 1);
                    objbuffer = resultnextedit;
                })
            }
            return objbuffer;
        }

        //ここからは別モン！！！
        function checkchildren(target: newvaluetype, base: newvaluetype[]) {
            let resultbuffer: newvaluetype[] = base;

            //  console.log(getid(base))
            const id = getid(target)
            if (id !== "") {
                const pcord = getcordbyid(id, iddata);
                console.log("")
                if (pcord) {
                    const pelemcoordinate = { x: pcord.x, y: pcord.y };
                    //  console.log(getvalue(pelem, "id")[0][1].toString())
                    resultbuffer = searchchildandedit(pelemcoordinate, getvalue(target, "id")[0][1].toString(), resultbuffer, iddata);
                    console.log(resultbuffer)
                }
            }
            if (base.obj.length !== 0) {
                base.obj.map(elem => {
                    resultbuffer = checkchildren(elem)
                    //   console.log(resultbuffer)
                })
            }
            return resultbuffer
        }
        let resultbuffer: newvaluetype[] = JSON.parse(JSON.stringify(base).toString());//深層コピー
        parent.map((pelem) => {

            resultbuffer = checkchildren(pelem);
        })
        return resultbuffer;
    }
    /**
     * 編集したNFを書き戻す
     * @param base 
     */
    function exportNF(base: newvaluetype[]): string[] {
        const indent = "    ";
        /**     
         * anyを使うな。
         * @param value 
         * @returns 
         */
        function nonobj(value: [string, string | number | boolean][], counter: number) {
            const result = value.map((elem) => {
                if (elem[0] !== "default_cord") {
                    return indent.repeat(counter) + tools.splitandtrim(elem[0]) + " = " + tools.splitandtrim(elem[1].toString());
                } else return "";
            }).filter((elem) => elem !== "")
            return result;
        };
        /**
        *オブジェクトの処理 
         */
        function obj(targetobj: newvaluetype[], conter: number): string[] {
            let result: string[] = [];
            targetobj.map((elem) => {
                result.push(indent.repeat(conter) + elem.name + " = {");

                nonobj(elem.value, conter + 1).map((elem) => {
                    result.push(elem);
                })
                if (elem.obj.length !== 0) {
                    obj(elem.obj, conter + 1).map(elem => result.push(elem));
                }
                result.push(indent.repeat(conter) + "}");
            })
            return result;
        }


        const resultbuff = base.map((elem) => {
            let returnblockbuffer: string[] = [];
            returnblockbuffer.push("focus = {");
            nonobj(elem.value, 1).map((elem) => {
                returnblockbuffer.push(elem);
            })
            obj(elem.obj, 1).map((elem) => {
                returnblockbuffer.push(elem);
            })
            returnblockbuffer.push("}");
            return returnblockbuffer.join("\n");
        })
        return resultbuff;
    }
    /**
     * 既存のデーターベースからIDのマッピングを行う
     * @param base データベース
     */
    function idmapping(base: newvaluetype[]): idmap[] {
        function idmappinginternal(base: newvaluetype): idmap[] {
            let result: idmap[] = [];
            let mapbuffer: idmap = { id: "", x: 0, y: 0 }
            base.value.map((elem2) => {
                switch (elem2[0]) {
                    case "id":
                        mapbuffer.id = elem2[1].toString();
                        break;
                    case "x":
                        mapbuffer.x = Number(elem2[1])
                        break;
                    case "y":
                        mapbuffer.y = Number(elem2[1])
                        break;
                    default:
                        break;
                }
            })
            if (mapbuffer.id !== "") {
                result.push(mapbuffer);
            }
            const childresult = ((
                () => {
                    if (base.obj.length !== 0) {
                        let resultbuffer: idmap[] = [];
                        base.obj.map(elem => {
                            idmappinginternal(elem).map((elem) => {
                                resultbuffer.push(elem);
                            })
                        })
                        return resultbuffer;
                    } else return []
                }
            ))();
            if (childresult.length !== 0) childresult.map(elem => result.push(elem));
            return result;
        }
        let result: idmap[] = [];
        base.map((elem3) => {
            const valuefromid = idmappinginternal(elem3);
            if (valuefromid.length !== 0) valuefromid.map(elem => result.push(elem));
        })
        //     console.log(result);
        return result.filter(elem => elem.id !== "")
    }

    function main() {
        // relative_position_id が相対

        const result = converter(inputCode);//コンバート後のFocusたち
        const iddata = idmapping(result);
        fs.writeFileSync("./id.json", JSON.stringify(iddata, null, '\t'))
        /**
         * 親要素
         */
        function getparent(base: newvaluetype[]) {
            function getparentinternal(elem2: newvaluetype): newvaluetype[] {
                let result: string[] = [];
                let flag = [false, false]
                elem2.value.map((elem) => {
                    if (elem[0].toString() === "id") {
                        flag[1] = true;
                    }
                })
                elem2.obj.map((elem) => {
                    if (elem.name.toString() === "prerequisite") {
                        //    console.log(elem)
                        flag[0] = true;
                    }
                })
                if (flag[0] !== true && flag[1] === true) {
                    //        console.log(elem2)
                    result.push(elem[0]);
                }
                if (elem2.obj.length !== 0) {
                    elem2.obj.map(elem => {
                        getparentinternal(elem).map(elem => result.push(elem))
                    })
                }
                return result
            }
            let result: newvaluetype[] = [];
            base.map(elem => {
                getparentinternal(elem).map(elem => {
                    result.push(elem);
                })
            })

            return result
        }
        const parenttree: newvaluetype[] = getparent(result);
        fs.writeFileSync("./result2.json", JSON.stringify(parenttree, null, '\t'))
        //   console.log(parenttree);


        const miningresult = miningchildrenandedit(parenttree, result, iddata);//相対座標に修正
        // console.log(miningresult);
        const rawnf = exportNF(miningresult).join('\n\n');
        fs.writeFileSync("./" + process.argv[2].split("\\")[process.argv[2].split("\\").length - 1].replace("\\", "").replace(".txt", "") + "_fix.txt", rawnf, "utf-8");
        console.log("正常に処理しました");
        setTimeout(() => {
            process.exit();
        }, 2000);



        //    fs.writeFileSync("./resultmining.json", JSON.stringify(miningresult, null, '\t'))
        // console.log(JSON.stringify(result, null, '\t'))
    }
    main()
}