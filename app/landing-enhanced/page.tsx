import React from 'react';

export default function BlindpotLandingPageEnhanced() {
  return (
    <>


<div className="fixed inset-0 pointer-events-none z-[-1] flex justify-between px-margin-mobile md:px-margin-desktop">
<div className="ledger-guide left-[20%]"></div>
<div className="ledger-guide left-[40%]"></div>
<div className="ledger-guide left-[60%]"></div>
<div className="ledger-guide left-[80%]"></div>
</div>

<header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 bg-paper hairline-b-thick">
<div className="flex items-center gap-gutter w-[20%]">
<a className="font-headline-md text-headline-md font-bold text-ink tracking-tighter flex items-center gap-2" href="#">
    <img src="/logo.png" alt="Blindpot" className="h-12 md:h-16 w-auto mix-blend-multiply" /></a>
</div>
<nav className="hidden md:flex items-center gap-margin-desktop justify-center flex-grow">
<a className="font-label-mono text-label-mono uppercase text-ink hover:underline decoration-2 underline-offset-4 transition-all px-2 py-1 font-bold" href="#">How it works</a>
<a className="font-label-mono text-label-mono uppercase text-ink hover:underline decoration-2 underline-offset-4 transition-all px-2 py-1 font-bold" href="#">Draws</a>
<a className="font-label-mono text-label-mono uppercase text-ink hover:underline decoration-2 underline-offset-4 transition-all px-2 py-1 font-bold" href="#">Docs</a>
</nav>
<div className="flex justify-end w-[20%]">
<button className="btn-secondary font-label-mono text-label-mono uppercase px-4 py-2 font-bold">
            Connect wallet
        </button>
</div>
</header>
<main className="flex-grow pt-[80px] flex flex-col">

<section className="flex flex-col md:flex-row min-h-[614px] relative">

<div className="w-full md:w-[60%] p-margin-mobile md:p-margin-desktop flex flex-col justify-center relative bg-paper z-10 hairline-b md:hairline-b-0 md:hairline-r">

<div className="absolute top-8 right-8 font-stamp-text text-stamp-text text-oxide-red opacity-70 border border-oxide-red px-2 py-1">
                    REF: 0X-SEC-INIT
                </div>
<div className="absolute bottom-8 left-8 font-stamp-text text-stamp-text text-ink opacity-50 rotate-90 origin-left">
                    DOC-ID: BP-GENESIS
                </div>
<div className="mb-12 mt-12">
<h1 className="font-headline-lg uppercase text-ink max-w-4xl break-words leading-[0.9] flex flex-col gap-2 relative z-20">
<span className="font-bold text-[64px] tracking-tight border-b border-ink/30 pb-2">YOUR SAVINGS.</span>
<span className="font-medium text-[48px] tracking-widest bg-ink text-paper px-4 py-2 mt-4 inline-block w-fit">SEALED FROM EVERYONE.</span>
<span className="font-normal text-[72px] mt-2 border-b-4 border-ink inline-block w-fit">EVEN US.</span>
</h1>
</div>
<div className="flex items-center gap-6">
<p className="font-label-mono text-body-lg text-ink max-w-sm border-l-2 border-oxide-red pl-4 py-2 bg-paper/80">
                    Cryptographic stealth deposits that shield your balances from public ledgers until you decide to withdraw.
                </p>
<div className="ml-auto mr-12">
<button className="btn-primary font-label-mono text-label-mono uppercase px-8 py-4 text-xl tracking-widest bg-paper hover:bg-surface-variant">
                        CONNECT WALLET
                    </button>
</div>
</div>
</div>

<div className="w-full md:w-[40%] bg-surface-container-high flex flex-col justify-center items-center relative overflow-hidden group p-8 hairline-b">

<div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-grid-overlay"></div>
<div className="absolute top-4 left-4 font-stamp-text text-stamp-text text-ink opacity-40">§ DEMONSTRATION</div>
<div className="z-10 bg-paper brutal-border p-8 shadow-hard w-full max-w-md reveal-group cursor-pointer relative">
<div className="absolute -inset-1 border border-ink/20 pointer-events-none"></div>
<div className="font-label-mono text-label-mono uppercase border-b-2 border-ink pb-4 mb-6 flex justify-between items-end">
<span className="text-xl font-bold tracking-widest">BALANCES</span>
<span className="text-on-surface-variant group-hover:hidden text-xs">this is what everyone else sees</span>
<span className="text-oxide-red font-bold hidden group-hover:block text-xs uppercase bg-oxide-red/10 px-2 py-1">this is what you see</span>
</div>
<div className="space-y-6 font-value-mono text-value-mono relative text-lg">
<div className="stamp -top-12 -right-8 text-2xl rotate-[15deg]">DECRYPTED</div>
<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity">
<div className="border-4 border-stamp-gray text-stamp-gray text-4xl font-bold p-2 rotate-[-20deg] tracking-widest font-stamp-text opacity-30">CONFIDENTIAL</div>
</div>
<div className="flex justify-between items-center hairline-b pb-4">
<span className="font-bold">USDC</span>
<div className="relative w-48 h-8 flex justify-end items-center bg-surface-variant border border-ink/20 px-2">
<div className="absolute inset-0 redact-bar m-1"></div>
<span className="reveal-text text-ink font-bold">$1,240.50</span>
</div>
</div>
<div className="flex justify-between items-center hairline-b pb-4">
<span className="font-bold">ETH</span>
<div className="relative w-36 h-8 flex justify-end items-center bg-surface-variant border border-ink/20 px-2">
<div className="absolute inset-0 redact-bar m-1"></div>
<span className="reveal-text text-ink font-bold">2.4500</span>
</div>
</div>
<div className="flex justify-between items-center pb-2">
<span className="font-bold">POT</span>
<div className="relative w-40 h-8 flex justify-end items-center bg-surface-variant border border-ink/20 px-2">
<div className="absolute inset-0 redact-bar m-1"></div>
<span className="reveal-text text-ink font-bold">8,500</span>
</div>
</div>
</div>
</div>
</div>
</section>

<div className="w-full bg-ink text-paper py-3 px-margin-mobile md:px-margin-desktop flex justify-between items-center font-label-mono text-label-mono uppercase text-xs tracking-widest font-bold">
<span>VERIFIED ZK-PROOF</span>
<span>BUILT ON ZAMA PROTOCOL · OPEN SOURCE · SEPOLIA TESTNET</span>
<span>DOC-REF: TRST-00</span>
</div>

<section className="border-b-2 border-ink bg-paper">
<div className="font-headline-md text-headline-md font-bold px-margin-mobile md:px-margin-desktop py-gutter hairline-b flex items-center gap-4">
<span className="text-oxide-red">§</span> OPERATIONAL FLOW
            </div>
<div className="flex flex-col md:flex-row w-full font-label-mono text-label-mono">

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink p-6 hover:bg-surface-variant transition-colors cursor-crosshair group relative">
<div className="absolute top-2 right-2 text-[10px] text-ink/40">OP-01</div>
<div className="text-oxide-red mb-4 text-3xl font-bold font-stamp-text">01</div>
<div className="uppercase mb-3 font-bold text-ink text-base tracking-widest border-b border-ink/30 pb-2 inline-block">DEPOSIT</div>
<div className="font-body-md text-sm text-ink/80 leading-relaxed">Funds are wrapped in fully homomorphic encryption.</div>
</div>

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink p-6 hover:bg-surface-variant transition-colors cursor-crosshair group relative">
<div className="absolute top-2 right-2 text-[10px] text-ink/40">OP-02</div>
<div className="text-oxide-red mb-4 text-3xl font-bold font-stamp-text">02</div>
<div className="uppercase mb-3 font-bold text-ink text-base tracking-widest border-b border-ink/30 pb-2 inline-block">HOLD</div>
<div className="font-body-md text-sm text-ink/80 leading-relaxed">Balances remain invisible on-chain while yielding.</div>
</div>

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink p-6 hover:bg-surface-variant transition-colors cursor-crosshair group relative">
<div className="absolute top-2 right-2 text-[10px] text-ink/40">OP-03</div>
<div className="text-oxide-red mb-4 text-3xl font-bold font-stamp-text">03</div>
<div className="uppercase mb-3 font-bold text-ink text-base tracking-widest border-b border-ink/30 pb-2 inline-block">DRAW</div>
<div className="font-body-md text-sm text-ink/80 leading-relaxed">Periodic zero-knowledge lotteries determine winners.</div>
</div>

<div className="flex-1 border-b md:border-b-0 md:border-r border-ink p-6 hover:bg-surface-variant transition-colors cursor-crosshair group relative">
<div className="absolute top-2 right-2 text-[10px] text-ink/40">OP-04</div>
<div className="text-oxide-red mb-4 text-3xl font-bold font-stamp-text">04</div>
<div className="uppercase mb-3 font-bold text-ink text-base tracking-widest border-b border-ink/30 pb-2 inline-block">CLAIM</div>
<div className="font-body-md text-sm text-ink/80 leading-relaxed">Winners claim prizes without revealing total holdings.</div>
</div>

<div className="flex-1 p-6 hover:bg-surface-variant transition-colors cursor-crosshair group relative bg-surface-container-high">
<div className="absolute top-2 right-2 text-[10px] text-ink/40">OP-05</div>
<div className="text-ink mb-4 text-3xl font-bold font-stamp-text">05</div>
<div className="uppercase mb-3 font-bold text-ink text-base tracking-widest border-b border-ink/30 pb-2 inline-block">WITHDRAW</div>
<div className="font-body-md text-sm text-ink/80 leading-relaxed">Decrypt and exit to standard assets at any time.</div>
</div>
</div>
</section>

<section className="flex flex-col md:flex-row min-h-[409px]">
<div className="w-full md:w-[20%] p-margin-mobile md:p-margin-desktop hairline-r hairline-b bg-surface-container-high flex flex-col justify-between">
<div className="font-headline-md text-headline-md font-bold uppercase break-words border-b-2 border-ink pb-4">
                    THREAT<br/>MODEL
                </div>
<div className="mt-auto pt-8">
<div className="font-stamp-text text-sm border border-oxide-red text-oxide-red px-2 py-1 inline-block mb-4">CONFIDENTIAL</div>
<span className="material-symbols-outlined text-5xl text-oxide-red" data-icon="warning" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
</div>
</div>
<div className="w-full md:w-[80%] flex flex-col md:flex-row">
<div className="flex-1 p-margin-mobile md:p-margin-desktop hairline-r hairline-b hover:bg-surface-variant transition-colors bg-paper">
<div className="flex items-center gap-2 mb-6 text-oxide-red font-stamp-text text-stamp-text border-b border-oxide-red/30 pb-2">
<span className="font-bold">§ INDEX_01</span>
</div>
<h3 className="font-label-mono text-label-mono uppercase font-bold mb-4 text-ink text-lg tracking-widest bg-ink text-paper inline-block px-2 py-1">Front-Running Mitigation</h3>
<p className="font-body-md text-body-md text-ink/80 leading-relaxed">
                         Public mempools expose your intents. By encrypting transaction data before it hits the sequencer, we blind MEV bots to your position sizing.
                     </p>
</div>
<div className="flex-1 p-margin-mobile md:p-margin-desktop hairline-r hairline-b hover:bg-surface-variant transition-colors bg-paper">
<div className="flex items-center gap-2 mb-6 text-oxide-red font-stamp-text text-stamp-text border-b border-oxide-red/30 pb-2">
<span className="font-bold">§ INDEX_02</span>
</div>
<h3 className="font-label-mono text-label-mono uppercase font-bold mb-4 text-ink text-lg tracking-widest bg-ink text-paper inline-block px-2 py-1">Wealth Obfuscation</h3>
<p className="font-body-md text-body-md text-ink/80 leading-relaxed">
                         Your on-chain net worth is no longer a public spectacle. Shield your total deposits from targeted social engineering and chain analysis.
                     </p>
</div>
<div className="flex-1 p-margin-mobile md:p-margin-desktop hairline-b hover:bg-surface-variant transition-colors bg-redacted-gray">
<div className="flex items-center gap-2 mb-6 text-oxide-red font-stamp-text text-stamp-text border-b border-oxide-red/30 pb-2">
<span className="font-bold">§ INDEX_03</span>
</div>
<h3 className="font-label-mono text-label-mono uppercase font-bold mb-4 text-ink text-lg tracking-widest bg-ink text-paper inline-block px-2 py-1">Regulatory Compliance</h3>
<p className="font-body-md text-body-md text-ink/80 leading-relaxed">
                         Privacy does not preclude compliance. View keys can be selectively generated for authorized auditors while maintaining operational secrecy.
                     </p>
</div>
</div>
</section>
</main>

<footer className="w-full py-gutter px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center border-t-[3px] border-ink bg-paper mt-auto z-10 relative">
<div className="font-label-mono text-label-mono font-bold text-ink mb-4 md:mb-0 uppercase tracking-widest">
            © BLINDPOT PROTOCOL. ALL RIGHTS RESERVED. <span className="ml-4 opacity-50">DOC-VER: 1.0.4</span>
</div>
<nav className="flex gap-margin-desktop font-label-mono text-label-mono font-bold">
<a className="text-ink hover:underline decoration-2 underline-offset-4 transition-colors uppercase" href="#">Security</a>
<a className="text-ink hover:underline decoration-2 underline-offset-4 transition-colors uppercase" href="#">Terms</a>
<a className="text-ink hover:underline decoration-2 underline-offset-4 transition-colors uppercase" href="#">Twitter</a>
</nav>
</footer>

    </>
  );
}



