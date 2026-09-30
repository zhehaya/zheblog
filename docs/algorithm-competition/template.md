---
description: "zhehaya的ACM板子"
---

# ACM板子

### 重链剖分（HLD)

```cpp
namespace HLD{
    //树的常规信息---
    vector<int>tree[N];
    int fa[N],size[N],depth[N];//深度用于lca
    //---树的常规信息

    int top[N];//链头
    int wson[N];//重儿子
    int hld_dfn[N],dfncnt;//dfn序（一条重链和一个子树dfn序连续
    void dfs1(int u,int father){//第一次dfs找到重儿子，父亲,子树重量和深度
        size[u]=1;fa[u]=father;
        depth[u]=depth[father]+1;
        for(int v:tree[u])
        {
            if(v!=father){//不回父边
                dfs1(v,u);
                size[u]+=size[v];
                if(size[v]>size[wson[u]]) wson[u]=v;//重儿子更换
            }
        }
    }
    void dfs2(int u,int father,int utop){//第二次dfs创建重链，标记链头，找到dfn序
        top[u]=utop;
        hld_dfn[u]=(++dfncnt);//dfs序
        //.........//可添加dfs序维护的东西
        if(wson[u]!=0) dfs2(wson[u],u,utop);//先遍历重儿子，链头不变
        for(int v:tree[u]){
            if(v!=father&&v!=wson[u]){
                dfs2(v,u,v);//再遍历轻儿子，链头变为轻儿子自身
            }
        }
    }
    int lca(int u,int v){//使用HLD找到LCA//也可改为返回ans
        while(top[u]!=top[v])
        {
            if(depth[top[u]]>depth[top[v]]) swap(u,v);//保证v的链头深度较深
            //...//这里可以更新dfs序中的[hld_dfn[top[v]],hld_dfn[v]]
            v=fa[top[v]];
        }
        if(depth[u]>depth[v]) swap(u,v);// 保证v比较深
        //...//这里可以更新[hld_dfn[u],hld_dfn[v]]
        return u;
        
    }
}
```

### 树状数组

```cpp
namespace BIT{
   int bit[N];//树状数组本体
   int n;//树状数组大小
   int lowbit(int x) {return x&(-x);}
   void update(int id,int date)//单点加
   {
        for(int i=id;i<=n;i+=lowbit(i)) bit[i]+=date;
   }
   int query(int id)//查询前缀和
   {
        int res=0;
        for(int i=id;i>0;i-=lowbit(i)) res+=bit[i];
        return res;
   }
}
```

### 快速幂

#### 递归写法

```cpp
long long fast_pow(long long a,long long k){
    if(k==0) return 1;
    long long res=fast_pow(a,k>>1)%p;
    if(k%2)
        return ((res*res)%p*a)%p;
    else 
        return (res*res)%p;
}
```

#### 非递归写法

```cpp
long long fast_pow(long long a,long long k)
{
    //a为当前位对应的a的幂次
    long long res=1;
    while(k>0)
    {
        if(k&1) res=(res*a)%p;
        a=(a*a)%p;
        k>>=1;
    }
    return res;
}
```

### memset

无论`t`是几维数组，均可以使用

```cpp
memset(t,val,sizeof(t));
```

进行初始化，使其全部为`val`，例如当`val=0`时数组将被全部初始化为0

!!!note
    注意：`int`数组只能初始化为`-1`或`0`，`char`数组则可以任意（有关字节存储问题）

## SAM

注：并未完全完善

```cpp
namespace SAM{
    void text();
    int last=0;//原串所在节点
    int cnt=0;//目前开创节点
    struct node
    {
        int son[26];
        int father=-1;//link树上的
        int num;
        int len;
    }sam[N<<1];
    void newnode(int length,int number){//建立新节点满足
        //cnt++;
        sam[++cnt].len=length;
        sam[cnt].father=-1;//先设父节点未知（建完后只有根节点0父节点未知）
        sam[cnt].num=number;
        memset(sam[cnt].son,0,sizeof(sam[cnt].son));
    }
    void insert(int c){//输入单字符（按字母表转化为数字）
        newnode(sam[last].len+1,1);//建立新endpos
        int now=cnt,p=last;//现在的节点编号和正在跳father的节点编号
        //cout<<now<<" "<<p<<endl;
        while(!sam[p].son[c]&&p!=-1)//跳father直到有这个儿子或者到头(越过0节点的头)
        {
            //cout<<p<<endl;
            sam[p].son[c]=now;
            p=sam[p].father;
        }
        if(p==-1) 
            sam[now].father=0;//cout<<"ee"<<endl;//父亲为根
        else{
            int sonnode=sam[p].son[c];//待拆点/处理的点
            if(sam[sonnode].len==sam[p].len+1) sam[now].father=sonnode;//不用拆点
            else{//拆点
                //cout<<"ee";
                newnode(sam[p].len+1,0);
                int newson=cnt;
                sam[newson].father=sam[sonnode].father;
                sam[sonnode].father=newson;//父亲关系
                memcpy(sam[newson].son,sam[sonnode].son,sizeof(sam[sonnode].son));//儿子关系
                //前面的儿子关系
                while(p!=-1&&sam[p].son[c]==sonnode)
                {
                    sam[p].son[c]=newson;//变更关系
                    p=sam[p].father;
                }
                sonnode=newson;//便于后边统计数量
                sam[now].father=newson;
            }
            //cout<<sonnode<<endl;
        }
        last=now;
    }
    int query(string s)//查询字符串s次数
    {
        int now=0,flag=1;
        for(int i=0;i<s.length();i++){
            int id=s[i]-'a';
            if(!sam[now].son[id]) {flag=0;break;}
            now=sam[now].son[id];
        }
        if(flag) return sam[now].num;
        else return 0;
    }
    void add(string t){//往后插入t
        for(char i:t)
        {
            insert(i-'a');
            //cout<<sam[cnt].len-sam<<endl;
            //text();
        }
            
    }
    long long total()//找子串个数
    {
        long long res=0;
        for(int i=1;i<=cnt;i++)
        { if(sam[i].num!=1)
            res=max(res,1ll*sam[i].num*sam[i].len);
        }return res;
    }
    void text(){//输出SAM
        cout<<"-----------------------------------------------"<<endl;
        for(int i=1;i<=cnt;i++)
        {
            cout<<i<<":father-"<<sam[i].father<<endl;
            cout<<"len:"<<sam[i].len<<" num:"<<sam[i].num<<endl;
            cout<<"son:";
            for(int j=0;j<=25;j++){
                if(sam[i].son[j]) cout<<j<<"-"<<sam[i].son[j]<<" ";
            }
            cout<<endl<<endl;
        }
        cout<<"-----------------------------------------------"<<endl;
    }
}
```

## AC自动机

给你一个文本串 $S$ 和 $n$ 个模式串 $T_{1 \sim n}$，请你分别求出每个模式串 $T_i$ 在 $S$ 中出现的次数。

第一行包含一个正整数 $n$ 表示模式串的个数。

接下来 $n$ 行，第 $i$ 行包含一个由小写英文字母构成的非空字符串 $T_i$。

最后一行包含一个由小写英文字母构成的非空字符串 $S$。

**数据不保证任意两个模式串不相同**。

输出包含 $n$ 行，其中第 $i$ 行包含一个非负整数表示 $T_i$ 在 $S$ 中出现的次数。

对于 $100 \%$ 的数据，$1 \le n \le 2 \times {10}^5$，$T_{1 \sim n}$ 的长度总和不超过 $2 \times {10}^5$，$S$ 的长度不超过 $2 \times {10}^6$。

```cpp
#include<bits/stdc++.h>
#define N 1145141
using namespace std;
namespace AC{//对应P5357即求各串出现次数的统计
    int cnt=0;//动态开点
    int total[N];//对于串出现次数的统计
    struct node{
        int ch[26];
        int fail=0;
        int num=0;
        vector<int>end;//注意可能有重复的字符串
    }actree[N];//ac自动机本体
    int inq[N];
    void newnode(){
        actree[++cnt].fail=0;
        actree[cnt].end.clear();
        inq[cnt]=0;
        memset(actree[cnt].ch,0,sizeof(actree[cnt].ch));
    }
    void insert(string s,int id)//加入一个字符串
    {
        int now=0;
        for(int i=0;i<s.length();i++)
        {
            int id=s[i]-'a';
            if(!actree[now].ch[id]) {
                newnode();
                actree[now].ch[id]=cnt;
            }
            now=actree[now].ch[id];
        }
        actree[now].end.push_back(id);
    }
    void bfs_fail()//bfs求fail指针
    {
        queue<int>BFS;
        for(int i=0;i<26;i++) if(actree[0].ch[i]) BFS.push(actree[0].ch[i]);
        while(!BFS.empty())
        {
            int now=BFS.front();
            //cout<<now;
            BFS.pop();
            for(int i=0;i<26;i++)
            {
                if(actree[now].ch[i]){//有了话fail为父亲的fail后继并且入队
                    actree[actree[now].ch[i]].fail=actree[actree[now].fail].ch[i];
                    inq[actree[actree[now].fail].ch[i]]++;
                    BFS.push(actree[now].ch[i]);
                }
                else{//无了话儿子就是父亲的fail后继
                   actree[now].ch[i]=actree[actree[now].fail].ch[i];
                }
            }
        }
    }
    int query(string s){//询问有多少种字串出现
        int res=0;
        int now=0;
        for(int i=0;i<s.length();i++)
        {
            int id=s[i]-'a';
            now=actree[now].ch[id];
            actree[now].num++;
        }
        return res;
    }
    void init()//初始化AC自动机
    {
        cnt=-1;
        newnode();
        cnt=0;
    }
    void topo(){//拓扑排序求total
        queue<int>BFS;
        for(int i=1;i<=cnt;i++)
        {
            if(inq[i]==0){
                BFS.push(i);
            }
        }
        while(!BFS.empty()){
            int now=BFS.front();BFS.pop();
            for(int id:actree[now].end) total[id]+=actree[now].num;
            int nxt=actree[now].fail;
            if(nxt!=0){
                actree[nxt].num+=actree[now].num;
                inq[nxt]--;
                if(inq[nxt]==0) BFS.push(nxt);
            }
        }
    }

}
int n;
string s[214514],t="";
int main()
{
AC::init();
cin>>n;
for(int i=1;i<=n;i++){
    cin>>s[i];
    AC::insert(s[i],i);t+='&';
    t+=s[i];
AC::total[i]=0;
//cout<<"kk";
}
AC::bfs_fail();
AC::query(t);
AC::topo();
int maxid=0;
for(int i=1;i<=n;i++){
    cout<<AC::total[i]<<endl;
}

}
```

## 逆元

当$p$为素数时，<img src="C:\Users\huang\AppData\Roaming\Typora\typora-user-images\image-20260918205148835.png" alt="image-20260918205148835" style="zoom: 33%;" />
