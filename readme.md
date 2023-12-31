![image](https://github.com/suke0930/hoi4_relative_converter/blob/main/iamge.png?raw=true)
# 概要
Hoi4の絶対座標で表記されたNFファイルを相対座標に変換するツールです

# 使い方

focusブロックのみ書かれたfocusのtxtをexeにドラッグアンドドロップすれば動きます 
### 例
<details>
<summary>想定されるtxtファイルの構造</summary>
<div>
```
    focus = {
        id = PRC-1
        icon = "GFX_focus_generic_china1"
        x = 4
        y = 6
        cost = 10
        ai_will_do = {
            factor = 100
        }
        completion_reward = {
        }
    }
    focus = {
        id = PRC-2
        icon = "GFX_focus_generic_china1"
        x = 12
        y = 6
        cost = 10
        ai_will_do = {
            factor = 100
        }
        completion_reward = {
        }
    }
    focus = {
        id = PRC-3
        icon = "GFX_focus_generic_china1"
        prerequisite = {
            focus = PRC-1
        }
        x = 4
        y = 7
        cost = 10
        ai_will_do = {
            factor = 100
        }
        completion_reward = {
        }
    }
```;
</div>
</details>
