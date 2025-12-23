
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    private handleReportBug = () => {
        const { error, errorInfo } = this.state;
        const recipient = 'byggpilot@gmail.com';
        const subject = encodeURIComponent('Felrapport: ByggPilot APD-Maker');

        let body = `Hej,\n\nJag stötte på ett fel när jag använde ByggPilot APD-Maker.\n\nBeskrivning av vad jag gjorde:\n(Skriv här...)\n\n`;

        if (error) {
            body += `--- Teknisk Information ---\nFelmeddelande: ${error.message}\n`;
            if (error.stack) {
                // Truncate stack trace to avoid URL length limits (approx 2000 chars safe limit)
                const stackClip = error.stack.substring(0, 1000);
                body += `\nStack Trace:\n${stackClip}\n`;
            }
        }

        if (errorInfo && errorInfo.componentStack) {
            const componentStackClip = errorInfo.componentStack.substring(0, 500);
            body += `\nComponent Stack:\n${componentStackClip}\n`;
        }

        body += `\nUser Agent: ${navigator.userAgent}`;

        window.location.href = `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(body)}`;
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
                    <div className="max-w-2xl bg-zinc-900 rounded-xl shadow-2xl border border-red-500/50 p-8 text-center">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-4 text-white">Vi ber om ursäkt!</h1>
                        <p className="text-zinc-300 mb-6 text-lg">
                            Ett oväntat fel har inträffat. För att vi ska kunna fixa detta så snabbt som möjligt vore vi enormt tacksamma om du ville rapportera felet.
                        </p>
                        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-5 mb-8 text-left">
                            <h4 className="font-bold text-zinc-200 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                Hjälp oss bli bättre!
                            </h4>
                            <p className="text-sm text-zinc-300/90 mb-3 leading-relaxed">
                                Vi på ByggPilot-teamet vill bygga världens bästa APD-verktyg, och vi behöver din hjälp för att hålla appen stabil och buggfri.
                            </p>
                            <p className="text-sm text-zinc-300/90 leading-relaxed">
                                Genom att klicka på knappen förbereds ett mail med teknisk information om kraschen. <strong>Inga ritningar eller personuppgifter delas.</strong> Ditt bidrag betyder enormt mycket för oss. Tack för att du hjälper till!
                            </p>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-lg text-left mb-8 overflow-auto max-h-48 border border-zinc-800 font-mono text-xs text-red-300">
                            {this.state.error && this.state.error.toString()}
                            <br />
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-bold transition-colors"
                            >
                                Ladda om sidan
                            </button>
                            <button
                                onClick={this.handleReportBug}
                                className="px-6 py-3 bg-zinc-200 hover:bg-white text-zinc-900 rounded-lg font-bold transition-colors shadow-lg shadow-zinc-200/20 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Rapportera fel (Mail)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
