# Day 9 Notes — Database Replication + CAP Theorem

## 1. Replication kya hai aur kyun chahiye

Ek hi database server single point of failure hota hai — crash ho jaye to poora data access hi nahi hoga. **Replication** = same data ki multiple copies, alag machines (nodes) pe.

**Roles:**
- **Primary** — jahan saare **writes** jate hain (sirf ek hota hai)
- **Secondary** — Primary se continuously data copy karte rehte hain, **reads** ke liye use ho sakte hain (agar explicitly allow kiya jaye)

## 2. Diagram (text form)

```
        [ App ]
           |
           v
      [ Primary ]  <-- saare writes yahan
        /      \
       v        v
 [Secondary1] [Secondary2]  <-- continuously copy karte hain
```

Primary crash → Secondaries **election** karte hain → ek naya Primary ban jata hai → App bina data-loss ke chalta rehta hai.

## 3. Setup — local replica set (Docker)

`docker-compose.mongo-replica.yml` mein 3 MongoDB containers (`mongo1`, `mongo2`, `mongo3`), sab `--replSet rs0` flag ke saath — batata hai ye teeno ek hi replica-set ka hissa honge.

**Replica set banane ka command:**
```bash
docker exec -it mongo1 mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongo1:27017'}, {_id: 1, host: 'mongo2:27017'}, {_id: 2, host: 'mongo3:27017'}]})"
```
Ye teeno nodes ko ek dusre ka pata deta hai — "tum sab mil ke ek replica set ho".

**Status check:**
```bash
docker exec -it mongo1 mongosh --eval "rs.status().members.map(m => ({name: m.name, state: m.stateStr}))"
```

## 4. Real observations jo experiment se mile

**Observation 1: Election khud-ba-khud bhi ho sakta hai**
Humne dekha ki `mongo2` Primary tha, lekin baad mein bina explicit crash kiye `mongo1` Primary ban gaya. **Lesson:** Election sirf manual crash pe nahi hota — network hiccup, resource contention, ya heartbeat timeout jaisi kisi bhi instability pe ho sakta hai. Production mein ye normal hai, app ko iske liye ready rehna chahiye (isiliye driver retry-logic rakhte hain).

**Observation 2: Secondary se read karne ke liye explicit permission chahiye**
```bash
rs.secondaryOk()
```
Default mein MongoDB Secondary se read block karta hai — kyunki Secondary ka data thoda "stale" (thoda purana) ho sakta hai (replication mein milliseconds ka lag hota hai). `secondaryOk()` explicitly bolta hai "mujhe stale data bhi chalega, read karne do".

**Bug jo mila:** Command ke end mein galti se extra text (`'rs.secondaryOk()'`) chala gaya copy-paste mein, jisse `mongosh` usko doosra argument (connection URI) samajh baitha. **Lesson:** Terminal commands copy karte waqt exact boundaries dhyan se dekho — extra characters bhi command ko todd sakte hain.

## 5. Failover Test — poora flow jo kiya

1. Primary (`mongo1`) mein data insert kiya
2. Secondary se confirm kiya data replicate ho chuka hai
3. `docker stop mongo1` — Primary ko jaan-bujh kar crash kiya
4. Baaki do nodes mein se **automatically** ek naya Primary ban gaya
5. Data **abhi bhi accessible tha** naye Primary/Secondary se — **koi data loss nahi hua**

**Yahi replication ka real fayda hai:** Ek node crash hone ke bawajood, system chalta raha, data safe raha.

## 6. CAP Theorem — is experiment se samjho

**CAP Theorem kehta hai:** Distributed system mein teeno cheezein (Consistency, Availability, Partition tolerance) ek saath **100% possible nahi** — trade-off karna padta hai.

- **Consistency (C)** — har read ko **latest** write dikhna chahiye
- **Availability (A)** — system hamesha **response de**, chahe kuch bhi ho
- **Partition tolerance (P)** — network split ho jaye (nodes ek dusre se baat na kar payein) to bhi system kaam kare

**Humara replica-set experiment kya prioritize karta hai:**
- Jab Primary crash hua, **turant** ek naya Primary elect nahi hota — kuch seconds lagte hain (election process). Is beech thodi der ke liye writes fail ho sakte hain — matlab **Availability thodi compromise** hui, taaki **Consistency maintain rahe** (ek hi confirmed Primary ho, do Primaries ek saath na ho jayein — "split brain" problem se bachne ke liye)
- Ye MongoDB ka default trade-off hai: **CP system** (Consistency + Partition tolerance ko priority, thoda Availability compromise election ke dauran)

**Real-world analogy:** Bank balance ke liye **Consistency zaroori** hai (galat balance dikhana dangerous hai) — thoda downtime chalega. Social media "likes count" ke liye **Availability zaroori** hai (thoda purana count dikh jaye to koi problem nahi) — ye **AP system** ka example hai.

## Key takeaway (interview ke liye)

Jab bhi koi system design interview mein poochे "apna database kaise design karoge scale ke liye" — turant **CAP theorem trade-off** discuss karo: "Is use-case mein Consistency zyada important hai ya Availability?" Ye hi wo sawaal hai jo interviewer sunna chahta hai.