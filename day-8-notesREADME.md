# Day 8 Notes — Scalability + Load Balancing

## 1. Problem jo solve ho raha hai

Ek single server/container **limited requests/second** handle kar sakta hai (CPU, RAM, network — sab limited hain). Agar traffic badhe:
- Response slow ho jata hai
- Server crash/hang ho sakta hai
- Poora system down ho sakta hai (single point of failure)

**Solution:** Same app ki **multiple copies (instances)** chalao, aur ek **Load Balancer** unke beech traffic baante.

## 2. Horizontal vs Vertical Scaling (important interview concept)

| Vertical Scaling | Horizontal Scaling |
|---|---|
| Ek hi server ko bada karo (zyada RAM/CPU) | Multiple servers add karo |
| Ek limit ke baad aur bada nahi kar sakte (hardware limit) | Theoretically unlimited scale |
| Downtime ho sakta hai upgrade ke time | Naye instances add karo bina existing ko rok ke |
| Simple hai, code change nahi chahiye | App ko **stateless** hona zaroori hai |

**Humne horizontal scaling kiya** — `docker-compose up --scale app=3` se 3 instances banaye.

## 3. Load Balancer kya karta hai

Ek **middleman** jo Client aur multiple App instances ke beech baithta hai:
1. Client sirf Load Balancer ka address janta hai (`http://localhost` — port 80)
2. Load Balancer decide karta hai **kaunsa instance** is request ko handle karega
3. Response wapas client tak Load Balancer hi bhejta hai

## 4. Diagram — poora flow (text form mein)

```
                    [ Client ]
                        |
                        v
                  [ Nginx (Load Balancer) ]
                    /       |       \
                   v        v        v
             [Instance1] [Instance2] [Instance3]
                   \        |        /
                    v       v       v
                [ Shared MongoDB + Redis ]
```

**Sabse important cheez:** Saare instances **same code** chalate hain aur **same database + cache share karte hain**. Isliye chahe koi bhi instance request handle kare, data hamesha consistent rehta hai — user ko farak nahi padta kaunsa instance usko serve kar raha hai.

## 5. Load Balancing Algorithms (interview mein poochte hain)

- **Round Robin** (jo humne use kiya, Nginx ka default) — ek-ek karke, baari-baari sabko request do
- **Least Connections** — jis instance pe sabse kam active connections hain, usko bhejo
- **IP Hash** — same client hamesha same instance pe jaye (session-based apps ke liye kaam aata hai)

## 6. Code — kya likha aur kyun

### `docker-compose.yml` mein app se `ports` hataya

```yaml
app:
  build: .
  # ports NAHI likha — kyunki 3 instances ek hi host-port pe bind nahi ho sakte
```

**Kyun:** Agar `ports: - "5000:5000"` likha hota, to jab `--scale app=3` karte, teeno instances host machine ke **same port 5000** pe bind karne ki koshish karte — conflict ho jata. Isliye instances ko bina fixed host-port ke chhoda, sirf Nginx hi bahar (port 80) expose hota hai.

### `nginx.conf`

```nginx
upstream taskflow_backend {
  server app:5000;
}

server {
  listen 80;
  location / {
    proxy_pass http://taskflow_backend;
  }
}
```

**Sabse important concept:** `server app:5000` mein `app` Docker Compose ka **service-name** hai, koi specific IP nahi. Jab Docker Compose `app` service ko 3 instances mein scale karta hai, Docker ka internal DNS **automatically** `app` naam ko teeno container-IPs ke beech resolve karta hai — Nginx ko manually teeno IPs likhne ki zarurat nahi padi.

### PORT ko explicitly override kiya

```yaml
environment:
  - PORT=5000
```

**Kyun:** Local `.env` mein `PORT=5002` tha (jo humne apne machine ke liye rakha tha), lekin container ke andar hume consistently `5000` chahiye tha (jo Nginx config expect kar raha hai). Environment variable se override kar diya — container ke andar ye value `.env` wali se **zyada priority** leti hai.

## 7. Command jo chalayi

```
docker-compose up --build --scale app=3
```

`--scale app=3` — sirf `app` service ki 3 copies banao, baaki services (redis, nginx) normal (1-1) chalengi.

**Bug jo mila:** Do commands ko ek hi line mein likh diya tha bina separate kiye:
```
docker-compose down docker-compose up --build --scale app=3   # GALAT
```
Terminal ne isko ek hi command samjha, `--build` ko `down` ka flag maan liya, error diya. **Fix:** Har command apni **alag line** mein, Enter dabake chalao.

## 8. Test/Verify kaise kiya

```
http://localhost/api/health
```
(Port number nahi — Nginx already port 80 pe hai, jo browser ka default hai)

Baar-baar refresh karne pe terminal logs mein dikha:
```
Request 1 → app-3
Request 2 → app-1
Request 3 → app-2
```
Ye **proof** tha ki round-robin load balancing kaam kar rahi thi.

**Bug jo mila:** `/api/healt` (h chhoot gaya "health" mein) likhne se `404 Not Found` mila — route exist hi nahi karta us spelling se. **Lesson:** 404 hamesha route-not-found ka matlab hota hai, server crash nahi — spelling/path pehle check karo.

## 9. Important cheez jo interview mein poochi ja sakti hai

**"Load balancer khud crash ho jaye to?"** — Ek Load Balancer bhi **single point of failure** ban sakta hai. Real production mein iska solution hota hai:
- Multiple Load Balancer instances (DNS round-robin unke beech bhi)
- Cloud providers (AWS ALB, Google Cloud LB) khud highly-available hote hain, managed service hoti hai

**"Stateless design zaroori kyun hai horizontal scaling ke liye?"** — Agar app kisi user ka session data apni memory mein store karta (in-memory session), aur agli request kisi doosre instance pe chali jati, us instance ko us user ka data pata hi nahi hota. Isiliye humne **JWT** use kiya tha Day 2 mein — token khud mein saari info rakhta hai, **kisi bhi instance** pe verify ho sakta hai, koi shared session-memory nahi chahiye. Yahi wajah hai ki JWT-based auth horizontal scaling ke saath itna achha kaam karta hai.

## Key takeaway

Load balancing sirf "traffic baantna" nahi hai — ye **poore system ko resilient banane** ka pehla step hai: agar ek instance crash ho jaye, baaki 2 kaam karte rahenge, user ko pata bhi nahi chalega.