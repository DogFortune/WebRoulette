## ランダム性について
`Math.random()`の代わりに[crypto.getRandomValues()](https://developer.mozilla.org/ja/docs/Web/API/Crypto/getRandomValues)を使っています。  
回転数・着地スライス・スライス内のオフセットすべてに適用しているので、連続でルーレットを回しても偏りが出ないようになっています。