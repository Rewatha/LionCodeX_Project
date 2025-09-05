// Global variables
let allCaseStudies = [];
let filteredStudies = [];
let currentFilter = 'all';
let studiesPerPage = 6;
let currentPage = 1;
let currentTestimonial = 1;
let testimonialInterval;

// Sample case studies data
const sampleCaseStudies = [
    {
        id: 'ariyana-resort',
        title: 'Ariyana Resort Complex Waterproofing',
        category: 'commercial',
        serviceType: 'commercial',
        complexity: 'highly-complex',
        area: 45000,
        duration: 6,
        location: 'Aturugiriya, Sri Lanka',
        client: 'Ariyana Developers (Pvt) Ltd',
        projectValue: 8500000,
        completionDate: '2024-08-15',
        description: 'Complete waterproofing solution for a 15-story luxury residential complex facing severe water infiltration issues during monsoon season.',
        challenge: {
            title: 'Complex Multi-Level Water Infiltration',
            description: 'The 15-story residential complex was experiencing severe water infiltration across multiple levels, affecting 200+ residents. Issues included failing roof membranes, compromised foundation sealing, and inadequate drainage systems.',
            points: [
                'Water infiltration affecting multiple floors during monsoon',
                'Failing waterproof membranes on roof and terraces', 
                'Compromised foundation waterproofing causing basement flooding',
                'Inadequate drainage leading to water accumulation',
                'Resident displacement and property damage concerns',
                'Strict timeline due to upcoming monsoon season'
            ]
        },
        solution: {
            title: 'Comprehensive Multi-Phase Waterproofing System',
            description: 'Implemented a systematic approach with advanced waterproofing technologies, working in phases to minimize resident disruption while ensuring complete protection.',
            points: [
                'Advanced polymer-modified bitumen membrane installation',
                'Complete foundation re-sealing with crystalline waterproofing',
                'Installation of integrated drainage and collection systems',
                'Terrace and balcony waterproofing with UV-resistant coatings',
                'Emergency temporary protection during work phases',
                'Quality assurance testing at each completion stage'
            ]
        },
        results: {
            title: 'Complete Protection & Enhanced Property Value',
            description: 'Achieved 100% water infiltration elimination with enhanced building value and resident satisfaction.',
            points: [
                '100% elimination of water infiltration across all levels',
                'Zero leakage incidents during subsequent monsoon seasons',
                '15-year comprehensive warranty provided',
                '25% increase in property valuation post-completion',
                'Full resident satisfaction and positive testimonials',
                'Project completed 2 weeks ahead of schedule'
            ]
        },
        timeline: [
            { date: '2024-02-01', phase: 'Project Assessment & Planning', description: 'Comprehensive building assessment and solution design' },
            { date: '2024-02-15', phase: 'Phase 1: Foundation Work', description: 'Foundation waterproofing and drainage installation' },
            { date: '2024-04-01', phase: 'Phase 2: Roof & Terraces', description: 'Roof membrane installation and terrace waterproofing' },
            { date: '2024-06-01', phase: 'Phase 3: Wall Systems', description: 'External wall treatment and balcony waterproofing' },
            { date: '2024-07-15', phase: 'Phase 4: Quality Testing', description: 'Comprehensive testing and quality assurance' },
            { date: '2024-08-15', phase: 'Project Completion', description: 'Final handover with warranty documentation' }
        ],
        testimonial: {
            name: 'Mr. Rajesh Patel',
            position: 'Property Developer',
            company: 'Ariyana Developers (Pvt) Ltd',
            quote: 'SealTech Engineering transformed our problematic building into a completely waterproof structure. Their systematic approach and expertise in handling complex foundation issues was exemplary.',
            rating: 5
        }
    },
    {
        id: 'boi-industrial',
        title: 'BOI Industrial Complex Roof Waterproofing',
        category: 'industrial',
        serviceType: 'roof',
        complexity: 'complex',
        area: 25000,
        duration: 4,
        location: 'Bingiriya, Sri Lanka',
        client: 'Board of Investment Sri Lanka',
        projectValue: 4200000,
        completionDate: '2024-06-30',
        description: 'Large-scale industrial roof waterproofing with minimal operational disruption for manufacturing facility.',
        challenge: {
            title: 'Industrial Operations Continuity',
            description: 'Waterproofing a 25,000 sq ft industrial roof while maintaining 24/7 manufacturing operations without disruption.',
            points: [
                'Continuous manufacturing operations requiring zero downtime',
                'Large-scale roof area with complex structural elements',
                'Chemical-resistant waterproofing requirements',
                'Extreme weather exposure and UV radiation',
                'Strict safety protocols for industrial environment',
                'Limited access windows for installation work'
            ]
        },
        solution: {
            title: 'Phased Installation with Operational Continuity',
            description: 'Developed a specialized approach for industrial environments with chemical-resistant materials and phased installation.',
            points: [
                'Sectional waterproofing to maintain operational areas',
                'Chemical-resistant modified bitumen membranes',
                'Advanced UV-stabilized protective coatings',
                'Integrated industrial drainage systems',
                'Night-shift installation to minimize disruption',
                'Comprehensive safety protocol implementation'
            ]
        },
        results: {
            title: 'Zero Downtime Achievement',
            description: 'Successfully completed waterproofing with zero operational disruption and enhanced facility protection.',
            points: [
                'Zero manufacturing downtime during installation',
                'Complete elimination of roof leakage issues',
                'Enhanced chemical resistance and durability',
                'Improved energy efficiency through reflective coatings',
                '12-year industrial warranty coverage',
                'Cost savings from eliminated maintenance issues'
            ]
        },
        timeline: [
            { date: '2024-03-01', phase: 'Industrial Assessment', description: 'Detailed facility assessment and safety planning' },
            { date: '2024-03-15', phase: 'Phase 1: Section A', description: 'First section waterproofing during night shifts' },
            { date: '2024-04-15', phase: 'Phase 2: Section B', description: 'Second section with advanced membrane installation' },
            { date: '2024-05-15', phase: 'Phase 3: Section C', description: 'Final section and drainage system completion' },
            { date: '2024-06-15', phase: 'Quality Assurance', description: 'Comprehensive testing and safety verification' },
            { date: '2024-06-30', phase: 'Project Handover', description: 'Final inspection and warranty documentation' }
        ],
        testimonial: {
            name: 'Ms. Priya Fernando',
            position: 'Facilities Manager',
            company: 'BOI Industrial Complex',
            quote: 'The industrial waterproofing project was completed with minimal disruption to our operations. SealTech\'s project management and technical execution exceeded our expectations.',
            rating: 5
        }
    },
    {
        id: 'luxury-villa',
        title: 'Luxury Villa Complete Waterproofing',
        category: 'residential',
        serviceType: 'comprehensive',
        complexity: 'standard',
        area: 3500,
        duration: 2,
        location: 'Colombo 07, Sri Lanka',
        client: 'Private Residence',
        projectValue: 850000,
        completionDate: '2024-05-20',
        description: 'Comprehensive waterproofing solution for luxury villa including roof, basement, and bathroom areas.',
        challenge: {
            title: 'Multi-Area Waterproofing Coordination',
            description: 'Coordinating waterproofing across multiple areas of an occupied luxury residence with minimal disruption.',
            points: [
                'Occupied residence requiring minimal disruption',
                'Multiple waterproofing areas needing coordination',
                'High-end finishes requiring careful protection',
                'Basement moisture issues affecting foundations',
                'Premium material requirements for luxury standards',
                'Tight timeline due to social events planning'
            ]
        },
        solution: {
            title: 'Coordinated Multi-Area Approach',
            description: 'Systematic approach addressing each area with premium materials and careful coordination to minimize disruption.',
            points: [
                'Premium polymer-modified waterproofing systems',
                'Basement crystalline waterproofing technology',
                'High-end bathroom waterproofing with tile compatibility',
                'Roof membrane with aesthetic integration',
                'Coordinated scheduling to minimize resident impact',
                'Protection systems for existing luxury finishes'
            ]
        },
        results: {
            title: 'Enhanced Luxury and Protection',
            description: 'Achieved complete waterproofing while enhancing the property\'s luxury appeal and value.',
            points: [
                'Complete elimination of moisture issues',
                'Enhanced property value and luxury appeal',
                'Zero disruption to resident lifestyle',
                'Seamless integration with existing architecture',
                '10-year comprehensive warranty coverage',
                'Positive impact on property resale value'
            ]
        },
        timeline: [
            { date: '2024-04-01', phase: 'Residence Assessment', description: 'Detailed assessment and luxury requirements planning' },
            { date: '2024-04-08', phase: 'Basement Waterproofing', description: 'Foundation and basement moisture elimination' },
            { date: '2024-04-22', phase: 'Bathroom Waterproofing', description: 'Premium bathroom waterproofing installation' },
            { date: '2024-05-06', phase: 'Roof Waterproofing', description: 'Roof membrane and drainage completion' },
            { date: '2024-05-20', phase: 'Final Completion', description: 'Quality testing and luxury finish restoration' }
        ],
        testimonial: {
            name: 'Mrs. Anjali Wickramasinghe',
            position: 'Homeowner',
            company: 'Private Residence',
            quote: 'SealTech provided exceptional service for our luxury villa. The work was completed with minimal disruption and the results exceeded our expectations.',
            rating: 5
        }
    },
    {
        id: 'emergency-flood',
        title: 'Emergency Flood Damage Restoration',
        category: 'emergency',
        serviceType: 'restoration',
        complexity: 'complex',
        area: 5000,
        duration: 1,
        location: 'Kalutara, Sri Lanka',
        client: 'Insurance Recovery Project',
        projectValue: 1200000,
        completionDate: '2024-03-15',
        description: 'Emergency waterproofing and restoration following severe flood damage to commercial building.',
        challenge: {
            title: 'Emergency Flood Damage Response',
            description: 'Rapid response to severe flood damage requiring immediate waterproofing to prevent further structural damage.',
            points: [
                'Severe flood damage requiring immediate response',
                'Risk of further structural damage from continued moisture',
                'Insurance timeline constraints for claim processing',
                'Contaminated water damage requiring specialized treatment',
                'Emergency access and safety considerations',
                'Coordination with other restoration contractors'
            ]
        },
        solution: {
            title: 'Rapid Emergency Response Protocol',
            description: 'Implemented emergency response procedures with rapid deployment and specialized flood damage treatment.',
            points: [
                '24-hour emergency response team deployment',
                'Immediate moisture extraction and drying systems',
                'Specialized flood-resistant waterproofing application',
                'Contamination treatment and sanitization',
                'Temporary protective measures during restoration',
                'Coordination with insurance and restoration teams'
            ]
        },
        results: {
            title: 'Rapid Recovery and Protection',
            description: 'Successfully prevented further damage and restored building to flood-resistant condition.',
            points: [
                'Prevented further structural damage from moisture',
                'Complete restoration to pre-flood condition',
                'Enhanced flood resistance for future protection',
                'Insurance claim successfully processed',
                'Building returned to operation within timeline',
                'Emergency response protocols established'
            ]
        },
        timeline: [
            { date: '2024-03-01', phase: 'Emergency Response', description: 'Immediate assessment and damage control' },
            { date: '2024-03-03', phase: 'Moisture Extraction', description: 'Water removal and drying system installation' },
            { date: '2024-03-06', phase: 'Damage Assessment', description: 'Comprehensive damage evaluation and planning' },
            { date: '2024-03-08', phase: 'Waterproofing Application', description: 'Flood-resistant waterproofing installation' },
            { date: '2024-03-12', phase: 'Quality Verification', description: 'Testing and insurance documentation' },
            { date: '2024-03-15', phase: 'Project Completion', description: 'Final handover and operation resumption' }
        ],
        testimonial: {
            name: 'Mr. Kamal Silva',
            position: 'Building Manager',
            company: 'Kalutara Commercial Complex',
            quote: 'Emergency waterproofing after flood damage was handled with urgency and professionalism. SealTech prevented further structural damage with their rapid response.',
            rating: 5
        }
    },
]