-- CreateTable
CREATE TABLE "ExcludedDomain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcludedDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExcludedDomain_userId_domain_key" ON "ExcludedDomain"("userId", "domain");

-- AddForeignKey
ALTER TABLE "ExcludedDomain" ADD CONSTRAINT "ExcludedDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
