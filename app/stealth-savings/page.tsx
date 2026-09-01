import React from 'react';

export default function BlindpotProtocolStealthSavingsApp() {
  return (
    <>


<header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 bg-paper hairline-b-thick">
<div className="flex items-center gap-gutter">
<a className="font-headline-md text-headline-md font-bold text-ink tracking-tighter flex items-center gap-2" href="#">
    <img src="/logo.png" alt="Blindpot" className="h-12 md:h-16 w-auto mix-blend-multiply" /></a>
</div>
<nav className="hidden md:flex items-center gap-gutter">
<a className="font-label-mono text-label-mono uppercase text-ink hover:bg-surface-container-high transition-colors px-2 py-1" href="#">How it works</a>
<a className="font-label-mono text-label-mono uppercase text-ink hover:bg-surface-container-high transition-colors px-2 py-1" href="#">Draws</a>
<a className="font-label-mono text-label-mono uppercase text-ink hover:bg-surface-container-high transition-colors px-2 py-1" href="#">Docs</a>
</nav>
<button className="btn-secondary font-label-mono text-label-mono uppercase px-4 py-2">
            Connect wallet
        </button>
</header>
<main className="flex-grow pt-[80px] flex flex-col">

<section className="flex flex-col md:flex-row hairline-b min-h-[614px]">

<div className="w-full md:w-[60%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center hairline-r relative">
<h1 className="font-headline-lg text-headline-lg uppercase text-ink max-w-3xl mb-gutter break-words leading-none">
                    YOUR SAVINGS.<br/>
<span className="hairline-t inline-block w-full mt-2 pt-2">SEALED FROM EVERYONE.</span><br/>
                    EVEN US.
                </h1>
<p className="font-body-lg text-body-lg text-ink max-w-xl mb-margin-desktop">
                    Cryptographic stealth deposits that shield your balances from public ledgers until you decide to withdraw.
                </p>
<div>
<button className="btn-primary font-label-mono text-label-mono uppercase px-6 py-3 text-lg">
                        Connect wallet
                    </button>
</div>

<div className="absolute top-4 right-4 font-stamp-text text-stamp-text text-oxide-red opacity-50">
                    REF: 0X-SEC-INIT
                </div>
</div>

<div className="w-full md:w-[40%] bg-surface-container-high p-margin-mobile md:p-margin-desktop flex flex-col justify-center items-center relative overflow-hidden group">

<div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(15, 15, 18, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 15, 18, 0.5) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
<div className="z-10 bg-paper border-2 border-ink p-gutter shadow-hard w-full max-w-sm reveal-group cursor-pointer">
<div className="font-label-mono text-label-mono uppercase border-b border-ink/20 pb-2 mb-4 flex justify-between">
<span>BALANCES</span>
<span className="text-on-surface-variant group-hover:hidden text-xs">this is what everyone else sees</span>
<span className="text-ink font-bold hidden group-hover:block text-xs">this is what you see</span>
</div>
<div className="space-y-4 font-value-mono text-value-mono relative">
<div className="stamp -top-4 -right-2 font-stamp-text text-stamp-text">DECRYPTED</div>
<div className="flex justify-between items-center hairline-b pb-2">
<span>USDC</span>
<div className="relative w-32 h-6 flex justify-end items-center">
<div className="absolute right-0 h-full w-full redact-bar"></div>
<span className="reveal-text text-brass font-bold">$1,240.50</span>
</div>
</div>
<div className="flex justify-between items-center hairline-b pb-2">
<span>ETH</span>
<div className="relative w-24 h-6 flex justify-end items-center">
<div className="absolute right-0 h-full w-full redact-bar"></div>
<span className="reveal-text text-brass font-bold">2.4500</span>
</div>
</div>
<div className="flex justify-between items-center">
<span>POT</span>
<div className="relative w-28 h-6 flex justify-end items-center">
<div className="absolute right-0 h-full w-full redact-bar"></div>
<span className="reveal-text text-brass font-bold">8,500</span>
</div>
</div>
</div>
</div>
</div>
</section>

<div className="w-full bg-ink text-paper py-2 px-margin-mobile md:px-margin-desktop flex justify-center items-center font-label-mono text-label-mono uppercase text-xs tracking-widest">
            Built on Zama Protocol · Open source · Sepolia testnet
        </div>

<section className="border-b-2 border-ink bg-paper">
<div className="font-headline-md text-headline-md font-bold px-margin-mobile md:px-margin-desktop py-gutter hairline-b">
                OPERATIONAL FLOW
            </div>
<div className="flex flex-col md:flex-row w-full font-label-mono text-label-mono">

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink/20 p-gutter hover:bg-surface-variant transition-colors cursor-crosshair group">
<div className="text-oxide-red mb-2 text-xl font-bold group-hover:scale-110 transition-transform origin-left">01</div>
<div className="uppercase mb-2 font-bold text-ink">DEPOSIT</div>
<div className="font-body-md text-sm text-on-surface-variant">Funds are wrapped in fully homomorphic encryption.</div>
</div>

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink/20 p-gutter hover:bg-surface-variant transition-colors cursor-crosshair group">
<div className="text-oxide-red mb-2 text-xl font-bold group-hover:scale-110 transition-transform origin-left">02</div>
<div className="uppercase mb-2 font-bold text-ink">HOLD</div>
<div className="font-body-md text-sm text-on-surface-variant">Balances remain invisible on-chain while yielding.</div>
</div>

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink/20 p-gutter hover:bg-surface-variant transition-colors cursor-crosshair group">
<div className="text-oxide-red mb-2 text-xl font-bold group-hover:scale-110 transition-transform origin-left">03</div>
<div className="uppercase mb-2 font-bold text-ink">DRAW</div>
<div className="font-body-md text-sm text-on-surface-variant">Periodic zero-knowledge lotteries determine winners.</div>
</div>

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink/20 p-gutter hover:bg-surface-variant transition-colors cursor-crosshair group">
<div className="text-oxide-red mb-2 text-xl font-bold group-hover:scale-110 transition-transform origin-left">04</div>
<div className="uppercase mb-2 font-bold text-ink">CLAIM</div>
<div className="font-body-md text-sm text-on-surface-variant">Winners claim prizes without revealing total holdings.</div>
</div>

<div className="flex-1 p-gutter hover:bg-surface-variant transition-colors cursor-crosshair group">
<div className="text-oxide-red mb-2 text-xl font-bold group-hover:scale-110 transition-transform origin-left">05</div>
<div className="uppercase mb-2 font-bold text-ink">WITHDRAW</div>
<div className="font-body-md text-sm text-on-surface-variant">Decrypt and exit to standard assets at any time.</div>
</div>
</div>
</section>

<section className="flex flex-col md:flex-row min-h-[409px]">
<div className="w-full md:w-1/4 p-margin-mobile md:p-margin-desktop hairline-r hairline-b bg-surface-container-high flex flex-col justify-between">
<div className="font-headline-md text-headline-md font-bold uppercase">
                    THREAT<br/>MODEL
                </div>
<span className="material-symbols-outlined text-4xl text-oxide-red mt-auto" data-icon="warning" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
</div>
<div className="w-full md:w-3/4 flex flex-col md:flex-row">
<div className="flex-1 p-margin-mobile md:p-margin-desktop hairline-r hairline-b hover:bg-surface-variant transition-colors">
<div className="flex items-center gap-2 mb-4 text-oxide-red font-stamp-text text-stamp-text">
<span className="material-symbols-outlined text-sm" data-icon="visibility">visibility</span>
                         INDEX_01
                     </div>
<h3 className="font-label-mono text-label-mono uppercase font-bold mb-2 text-ink">Front-Running Mitigation</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
                         Public mempools expose your intents. By encrypting transaction data before it hits the sequencer, we blind MEV bots to your position sizing.
                     </p>
</div>
<div className="flex-1 p-margin-mobile md:p-margin-desktop hairline-r hairline-b hover:bg-surface-variant transition-colors">
<div className="flex items-center gap-2 mb-4 text-oxide-red font-stamp-text text-stamp-text">
<span className="material-symbols-outlined text-sm" data-icon="account_balance">account_balance</span>
                         INDEX_02
                     </div>
<h3 className="font-label-mono text-label-mono uppercase font-bold mb-2 text-ink">Wealth Obfuscation</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
                         Your on-chain net worth is no longer a public spectacle. Shield your total deposits from targeted social engineering and chain analysis.
                     </p>
</div>
<div className="flex-1 p-margin-mobile md:p-margin-desktop hairline-b hover:bg-surface-variant transition-colors bg-redacted-gray">
<div className="flex items-center gap-2 mb-4 text-oxide-red font-stamp-text text-stamp-text">
<span className="material-symbols-outlined text-sm" data-icon="gavel">gavel</span>
                         INDEX_03
                     </div>
<h3 className="font-label-mono text-label-mono uppercase font-bold mb-2 text-ink">Regulatory Compliance</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
                         Privacy does not preclude compliance. View keys can be selectively generated for authorized auditors while maintaining operational secrecy.
                     </p>
</div>
</div>
</section>
</main>

<footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center border-t-2 border-ink bg-paper mt-auto">
<div className="font-label-mono text-label-mono font-bold text-ink mb-4 md:mb-0">
            © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED.
        </div>
<nav className="flex gap-gutter font-label-mono text-label-mono">
<a className="text-on-surface-variant hover:text-ink hover:underline transition-colors" href="#">Security</a>
<a className="text-on-surface-variant hover:text-ink hover:underline transition-colors" href="#">Terms</a>
<a className="text-on-surface-variant hover:text-ink hover:underline transition-colors" href="#">Twitter</a>
</nav>
</footer>

    </>
  );
}



