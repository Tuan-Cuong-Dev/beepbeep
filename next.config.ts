/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
    ],
  },
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: {"type":"service_account","project_id":"ebikerental-e1178","private_key_id":"55a83d10f20c9e0f3fc278a4bc8b2827d26c5584","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCw7QWKP2fPUR9x\\nDpscOQnMeLoMSZul9VxoXu4FLZjYiJJeBtbOUqXJR0+jkrWW7LQ4DLet+lkvxE45\\n97Unav8b/G7qZ9Y6m87YzoYqGZp94rvE85n7av0y+KG7v5INtnrmT6QzDVpJzOZ4\\npLwnEh8iTDqGK2ztD+D5y4QPaQZ2XLg+hfNc1AjygGFIB6J4tyqG7GeocWOk8mg4\\n38t+o7O50R64PXum/yHOZm95NjyPOUO6RKwLgZqEHJBa2okKqm/0QsdxSeF1zsSt\\naShYwQhtMMAkXR2WymGE02t6NGfH5noH5b35RKzT1J/Ky+ehcas4G6vJGSi5M3X2\\nFxj/HUDfAgMBAAECggEALhN0I2ZS1yt1yEA5BfcWxbDVJvkOd4B4MdgzHZcb3Jxo\\nneMjEvV0JoCTTXKaJvV7E7PALCdsDaQOiUso2tyjFns9uX8UTAwiqNTUHOexE8K2\\nCts0CUV6LkmQ+S+xTi/tPsiT5xW9o0Wg6d9g/r3Z7Nk0TpfFlNFTUkp9mHPOEomx\\nGaRz/nbbiA1iwyyq0oxNyh2pfpH8TIxgDqyAbKbKja4eaY9e41YpglGVLLKF9kbs\\n8CyMdL5xHHoX679U2DvfrM7aucg/aClK8Yw6noWEa6HPNbJycrj8/CkMvZ7mXTeV\\n8eiNEmyX1psSV5x9OApVNEqkESt7BHrQ7bOo2OKCOQKBgQDfRflieDaOsaZ62qLa\\n6G3RLdAktiENgnDHt4UC/dX7XL608EpN+1guXWMYu5b0XHd7ffqJBDxqxWTlLMa0\\nH8sSWOcmqOPt/vhNLUxPGb7GkB55tVwq7hOn0seV4tOH4qsdSIsMyD2sMAAkIGN+\\nbKOAQJurw8C3At5CJDoyDoVvtwKBgQDK2+wUS5wexELQtR0c84MkxPSzBIAvo39Y\\ncrT61qBMn87/Y3kbjkhnxqwn2zZ45XmUeLbfP/Q66cUQhmHCT1WXW9urNnaY7hQ1\\nr6C2UQsbk2BkyNbnG2gYmeOuywx9KyMARQNG1u6I5dfX+8BcmVRkgnaJpFodIchW\\nkqPBEOVoGQKBgQC7Qn71HYn0h/7vDyyDmWlxhZELGU4DfKGGf98pMSglGBZCvz4y\\nxVmiGWUhu0PSUzNK+dAE1u6tRj1nEPTe4cN58eJ8xC3W0IAEirdzqE4fT4Sf44IX\\n53HI0bnfdkyfrXaCqvMkl1VSczfLFPcdc5R13roxh468b8Vlh+jfTtqPZQKBgC1N\\nqA9wQ1FrqzBJAlNw3pzbj3pbSvVYohvyohBS1kHGfsfyQx2wTONALzpHbobZWKmb\\nu9tnwPdXNbdXC4YFiavfy9MUuq+0m7bRniaZOs3Rv/lCERxTto+n7n0ew49AjvSE\\ndRLg9SyFiAqoInGLnJlFuYtLtQREgyUyYne/ejwhAoGBANldxsVvZrTFhZkuQsiF\\nPT7E2UBnAYGs8mvBNDvvhZsGEN59/xIBtCar0nkwKNW0vXtGwL+nSIE+a7I5BEpI\\n9u15JJO4JMXHg/2Q85f8PXldt1tTB7T1kYOO0SpR96S/BKx5ZX9Dqfks7kXXiY9r\\nyi2HK0XVnpQngtQRXLIC27tW\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-fbsvc@ebikerental-e1178.iam.gserviceaccount.com","client_id":"105016386969319104699","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ebikerental-e1178.iam.gserviceaccount.com","universe_domain":"googleapis.com"},
  },
  
 eslint: {
    ignoreDuringBuilds: true, // ⚠️ Bỏ qua lỗi eslint khi build
  },
  typescript: {
    ignoreBuildErrors: true,  // ⚠️ Bỏ qua lỗi TypeScript khi build
  },
};

module.exports = nextConfig;
