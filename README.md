## UDO API

A sample Node.js app to demonstrate **__udo-client__** & **__udo-ca-client__** Node.js SDK APIs

### Prerequisites and setup:

* [Docker](https://www.docker.com/products/overview) - v1.12 or higher
* [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
* [Git client](https://git-scm.com/downloads) - needed for clone commands
* **Node.js** v8.9.0 or higher
* [Download Docker images](https://docker.m-chain.com)

```
git clone https://github.com/m-chain/udo-api.git
cd udo-api
chmod 777 ./common/clean.sh
npm install
npm rebuild

./setupNetwork.sh
./createChannelAndInstallChaincode.sh
```

access http://localhost:4000

注：

用到的数据表如下：

t_block_ext_info　区块扩展信息

t_charge_record　手续费记录

t_idx_gas　手续费返还临时表

t_idx_record　数据同步跟踪

创建链时需要清除上面表里面的数据。

