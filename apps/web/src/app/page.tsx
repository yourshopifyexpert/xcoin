export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            XCoin Crypto Tax Platform
          </h1>
          <p className="text-xl text-primary-100 mb-8">
            Calculate, track, and file your cryptocurrency taxes with ease
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-3 rounded-lg transition-colors">
              Get Started
            </button>
            <button className="bg-white text-primary-900 hover:bg-gray-100 px-8 py-3 rounded-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              title: 'Smart Integration',
              description:
                'Connect your wallets and exchanges automatically',
            },
            {
              title: 'AI-Powered Reconciliation',
              description: 'AI helps identify and categorize transactions',
            },
            {
              title: 'Tax Reports',
              description: 'Generate reports for your country',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
