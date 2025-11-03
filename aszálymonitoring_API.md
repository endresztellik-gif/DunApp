#ASZÁLYMONITORIN API
https://aszalymonitoring.vizugy.hu/makings/api.docx
aszalymonitoring.vizugy.hu weboldal API leírása (2022-09-29)
Az API segítségével adatokat kérhetünk vissza a weboldalról. Mivel az adatok ingyen és mindenféle korlátozás nélkül elérhetőek bárki számára, így az API használatához nem szükséges regisztráció.
Az API elérési útvonala
https://aszalymonitoring.vizugy.hu/api.php?view=A_kérés_neve[&attribútumok]
Kérések
A kérés neve	Leírás	Attribútumok
getvariables	A rendszer által mért paramétereket kéri vissza	Nincs
getstations	A rendszerben található állomásokat kéri vissza	Nincs
getmeas	A rendszerben található méréseket/számított adatokat kéri vissza	statid – az állomás azonosító
varid – a paraméter azonosító
fromdate – a kezdődátum
todate – a befejező dátum

getvariables
A kérés segítségével a rendszerben mért paraméterek adatai kérhetőek vissza.  A válasz egy JSON string lesz, melyben minden paraméterhez a következő struktúra tartozik:
Attribútum	Leírás
name	A paraméter magyar neve
unit	A paraméter mértékegysége, amelyben a hozzá tartozó adatok tárolva vannak
minfreq	A paraméter mérésének/számításának gyakorisága, vagy „hourly”, vagy „daily”
computed	A paraméter számított (1) vagy mért (0) érték
varid	A paraméter azonosítója
level	A paraméter mérési szintje, nem minden esetben van megadva

Kérés példa
<?php
$url = „http://aszalymonitoring.vizugy.hu/api.php”;
$curl = curl_init();

curl_setopt ( $curl, CURLOPT_URL, $url );
curl_setopt ( $curl, CURLOPT_HEADER, 0 );
curl_setopt ( $curl, CURLOPT_RETURNTRANSFER, 1 );
curl_setopt ( $curl, CURLOPT_POST, 1);
curl_setopt ( $curl, CURLOPT_PORT, 80);
curl_setopt ( $curl, CURLOPT_POSTFIELDS, 'view=getvariables');
curl_setopt ( $curl, CURLOPT_TIMEOUT, 10);
curl_setopt ( $curl, CURLOPT_SSL_VERIFYPEER, 0);

$ret = curl_exec($curl);
curl_close($curl);
?>
Válasz példa  
<?php json_decode(html_entity_decode($ret));?> =>
array(1) {
  [0]=>
  object(stdClass)#6 (5) {
    ["name"]=>
    string(21) "Levegőhőmérséklet"
    ["unit"]=>
    string(3) "°C"
    ["minfreq"]=>
    string(6) "hourly"
    ["computed"]=>
    int(0)
    ["varid"]=>
    int(1)
  }
}

getstations
A függvény segítségével a rendszerben tárolt állomások adatai kérhetőek vissza. A válasz egy JSON string lesz, amelyben minden állomás a következő struktúra szerint épül fel:
Attribútum	Leírás
statid	Az állomás azonosítója
name	Az állomás neve
eovx	Egységes Országos Vetület alapján vett x koordináta
eovy	Egységes Országos Vetület alapján vett y koordináta

Kérés példa
<?php
$url = „http://aszalymonitoring.vizugy.hu/api.php”;
$curl = curl_init();

curl_setopt ( $curl, CURLOPT_URL, $url );
curl_setopt ( $curl, CURLOPT_HEADER, 0 );
curl_setopt ( $curl, CURLOPT_RETURNTRANSFER, 1 );
curl_setopt ( $curl, CURLOPT_POST, 1);
curl_setopt ( $curl, CURLOPT_PORT, 80);
curl_setopt ( $curl, CURLOPT_POSTFIELDS, 'view=getstations');
curl_setopt ( $curl, CURLOPT_TIMEOUT, 10);
curl_setopt ( $curl, CURLOPT_SSL_VERIFYPEER, 0);

$ret = curl_exec($curl);
curl_close($curl);
?>
Válasz példa:
<?php json_decode(html_entity_decode($ret));?> =>
array(1) {
  [0]=>
  object(stdClass)#6 (4) {
    ["statid"]=>
    string(36) "07F16A43-6FBA-4A77-A22A-BFE79D336204"
    ["name"]=>
    string(7) "Ádánd"
    ["eovx"]=>
    string(13) "170073.000000"
    ["eovy"]=>
    string(13) "584904.000000"
  }
}
getmeas
A kérés segítségével a rendszerben a megadott paraméterhez tartozó mérések/kiszámított értékek kérdezhetőek vissza. Megjegyzés: a számított paraméterek nem minden állomáson érhetőek el.
A kérés attribútumai:
•	statid – az állomás azonosító, nem kötelező, a getstations kéréssel visszakapott állomásazonosító kerülhet ide. Ha nincs megadva akkor minden állomásra visszakéri az adott paraméter méréseit
•	varid – a paraméter azonosító, kötelező, a getvariables kéréssel visszakapott paraméter azonosító kerülhet ide
•	fromdate – az adatok visszakérésének kezdő dátuma YYYY-mm-dd formátumban. Nem kötelező megadni. Ha nincs megadva, akkor az aktuális napot megelőző 7 nappal korábbi nap lesz kezdő dátumnak tekintve. Helyi időben kell megadni! A pontos érték az YYYY-mm-dd 00:00:00 lesz.
•	todate – az adatok visszakérésnek befejező dátuma YYYY-mm-dd formátumban. Nem kötelező megadni. Ha nincs megadva, akkor az aktuális nap lesz befejező dátumnak beállítva. Helyi időben kell megadni! A pontos érték YYYY-mm-dd 23:59:00 lesz. Ha nincs megadva a fromdate akkor a todate mindig az aktuális nap lesz.
A válasz egy JSON string lesz, amelyben a minden egyes mérés a következő struktúrában szerepel:
Attribútum	Leírás
statid	Az állomás azonosítója. Csak abban az esetben szerepel az eredményben, ha a kérésben nem volt megadva a statid változó
date	A mérés időpontja, illetve az érték mely napra vonatkozik Y-m-d H:i:s.v formátumban. A dátum jelenleg helyi időben van megadva!
value	Az érték, amely a paraméternek megfelelő mértékegységben van megadva

Kérés példa ha meg van adva a statid
<?php
$url = „http://aszalymonitoring.vizugy.hu/api.php”;
$curl = curl_init();

curl_setopt ( $curl, CURLOPT_URL, $url );
curl_setopt ( $curl, CURLOPT_HEADER, 0 );
curl_setopt ( $curl, CURLOPT_RETURNTRANSFER, 1 );
curl_setopt ( $curl, CURLOPT_POST, 1);
curl_setopt ( $curl, CURLOPT_PORT, 80);
curl_setopt ( $curl, CURLOPT_POSTFIELDS, 'view=getmeas&varid=2&fromdate=2018-05-29&todate=2018-05-31&statid=ID');
curl_setopt ( $curl, CURLOPT_TIMEOUT, 10);
curl_setopt ( $curl, CURLOPT_SSL_VERIFYPEER, 0);

$ret = curl_exec($curl);
curl_close($curl);
?>
Válasz példa
array(1) {
  [0]=>
  array(73) {
    [0]=>
    object(stdClass)#8 (2) {
      ["value"]=>
      string(4) "22.9"
      ["date"]=>
      string(23) "2018-05-27 00:00:00.000"
    }
}



Változások

2022-09-29 	A getmeas kérés esetében a statid megadása ezentúl nem kötelező. Ha nincs megadva, akkor az összes állomás mérése benne lesz az eredményben a varid változóban megadott paraméterre
