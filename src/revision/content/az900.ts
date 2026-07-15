import { lesson } from '../builders';
import type { RevisionCourse } from '../types';

const cloudSources = ['az-study-guide', 'az-cloud-path'];
const serviceSources = ['az-study-guide', 'az-services-path'];
const governanceSources = ['az-study-guide', 'az-governance-path'];

export const az900Course: RevisionCourse = {
  examCode: 'AZ-900',
  title: 'Microsoft Azure Fundamentals',
  shortTitle: 'Azure Fundamentals',
  description: 'A connected guide to cloud concepts, core Azure architecture and services, security, cost, governance, deployment, and operations.',
  blueprintVersion: '2026-07-20',
  contentVersion: '2026.07.1',
  lastReviewed: '2026-07-15',
  accent: '#087ea4',
  domains: [
    { id: 'cloud-concepts', title: 'Describe cloud concepts', weight: 28 },
    { id: 'architecture-services', title: 'Describe Azure architecture and services', weight: 38 },
    { id: 'management-governance', title: 'Describe Azure management and governance', weight: 34 }
  ],
  sources: [
    { id: 'az-study-guide', title: 'AZ-900 official study guide', url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900' },
    { id: 'az-cloud-path', title: 'Describe cloud concepts learning path', url: 'https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/' },
    { id: 'az-services-path', title: 'Describe Azure architecture and services learning path', url: 'https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/' },
    { id: 'az-governance-path', title: 'Describe Azure management and governance learning path', url: 'https://learn.microsoft.com/en-us/training/paths/describe-azure-management-governance/' },
    { id: 'well-architected', title: 'Azure Well-Architected Framework', url: 'https://learn.microsoft.com/en-us/azure/well-architected/' },
    { id: 'azure-geographies', title: 'Azure geographies and regions', url: 'https://learn.microsoft.com/en-us/azure/reliability/regions-list' },
    { id: 'compute-docs', title: 'Azure compute documentation', url: 'https://learn.microsoft.com/en-us/azure/?product=compute' },
    { id: 'network-docs', title: 'Azure networking documentation', url: 'https://learn.microsoft.com/en-us/azure/networking/' },
    { id: 'storage-docs', title: 'Introduction to Azure Storage', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-introduction' },
    { id: 'entra-docs', title: 'Microsoft Entra documentation', url: 'https://learn.microsoft.com/en-us/entra/' },
    { id: 'defender-docs', title: 'Microsoft Defender for Cloud overview', url: 'https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction' },
    { id: 'cost-docs', title: 'Microsoft Cost Management documentation', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/cost-management-billing-overview' },
    { id: 'governance-docs', title: 'Azure governance documentation', url: 'https://learn.microsoft.com/en-us/azure/governance/' },
    { id: 'arm-docs', title: 'Azure Resource Manager overview', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview' },
    { id: 'monitor-docs', title: 'Azure Monitor overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/overview' }
  ],
  pages: [
    lesson({
      id: 'cloud-computing', objectiveId: 'cloud-computing', slug: 'cloud-computing', title: 'Cloud computing', domainId: 'cloud-concepts',
      summary: 'Understand consumption-based computing, deployment models, shared responsibility, CapEx and OpEx, and serverless execution.', estimatedMinutes: 15,
      keywords: ['cloud', 'public cloud', 'private cloud', 'hybrid cloud', 'shared responsibility', 'CapEx', 'OpEx', 'consumption', 'serverless'],
      blueprintPoints: ['Define cloud computing', 'Describe public, private, and hybrid cloud', 'Describe the shared responsibility model', 'Compare consumption-based and traditional cost models', 'Describe serverless computing'],
      sourceIds: cloudSources,
      overview: [
        'Cloud computing delivers computing services over a network using pooled infrastructure, elastic capacity, and metered consumption. Customers can provision resources quickly without owning every layer of the underlying datacenter.',
        'Responsibility shifts with the service model, but the customer always retains responsibility for data, identities, access decisions, and the correct configuration of what they control.'
      ],
      keyPoints: [
        'Public cloud uses provider-owned infrastructure shared securely across customers; private cloud is dedicated to one organization; hybrid cloud integrates private/on-premises and public environments.',
        'Capital expenditure buys assets up front; operational expenditure pays for ongoing use. Cloud commonly shifts spending toward variable OpEx, though reservations and committed spend can make the picture more nuanced.',
        'Consumption pricing meters usage. Elasticity and automation can reduce waste, but resources left running can still create unexpected cost.',
        'The provider is responsible for physical datacenters, hosts, and core networking. Customer responsibility increases from SaaS to PaaS to IaaS.',
        'Serverless means the provider manages infrastructure and scaling while the customer supplies event-driven code or configuration and pays according to executions or consumed capacity.',
        'Multicloud uses services from multiple public-cloud providers; it is distinct from hybrid cloud, which specifically connects public cloud with private/on-premises resources.'
      ],
      comparison: { title: 'Deployment models', columns: ['Model', 'Best fit', 'Trade-off'], rows: [
        ['Public cloud', 'Fast scale, broad managed services, global reach', 'Less physical control; governance remains essential'],
        ['Private cloud', 'Dedicated environment or specialized control requirements', 'Organization carries more cost and operational responsibility'],
        ['Hybrid cloud', 'Gradual migration, data locality, or integrated edge/on-premises needs', 'Connectivity and management become more complex'],
        ['Multicloud', 'Provider diversity or service-specific strategy', 'Skills, identity, networking, and governance span providers']
      ] },
      flow: { title: 'Shared responsibility test', steps: [
        { title: 'Name the service model', text: 'SaaS, PaaS, IaaS, or an on-premises workload.' },
        { title: 'Locate the layer', text: 'Physical facility, host, OS, runtime, application, identity, or data.' },
        { title: 'Assign control', text: 'The party that configures or operates the layer normally carries responsibility for it.' },
        { title: 'Remember the constants', text: 'Customers remain responsible for their data, accounts, access, and endpoint choices.' }
      ] },
      insight: ['Cloud changes who operates each layer; it does not transfer accountability for business data or access decisions.'],
      traps: ['Serverless still uses servers—the provider abstracts their provisioning and operation.', 'Hybrid is not simply “using two clouds”; it integrates private/on-premises and public environments.', 'Consumption-based billing can improve efficiency but does not guarantee lower cost without monitoring and governance.', 'Moving from IaaS to SaaS reduces customer operational responsibility but also reduces low-level control.'],
      checklist: ['Compare public, private, hybrid, and multicloud', 'Assign responsibilities by service layer', 'Distinguish CapEx and OpEx', 'Explain consumption pricing and elasticity', 'Describe what serverless abstracts'],
      recall: [
        { question: 'Who is always responsible for customer data and accounts?', answer: 'The customer.' },
        { question: 'Which model integrates on-premises resources with public cloud?', answer: 'Hybrid cloud.' },
        { question: 'What financial model is associated with metered cloud use?', answer: 'Operational expenditure and consumption-based pricing.' }
      ]
    }),
    lesson({
      id: 'cloud-benefits', objectiveId: 'cloud-benefits', slug: 'cloud-benefits', title: 'Benefits of cloud services', domainId: 'cloud-concepts',
      summary: 'Connect availability, scalability, elasticity, reliability, predictability, security, governance, and manageability to architecture choices.', estimatedMinutes: 14,
      keywords: ['availability', 'scalability', 'elasticity', 'reliability', 'predictability', 'security', 'governance', 'manageability', 'SLA'],
      blueprintPoints: ['Describe high availability and scalability', 'Describe reliability and predictability', 'Describe cloud security and governance benefits', 'Describe cloud manageability benefits'],
      sourceIds: [...cloudSources, 'well-architected'],
      overview: [
        'Cloud capabilities make resilient and scalable architecture easier to obtain, but they are not automatic. You must select suitable services, deploy across failure boundaries, monitor health, and configure scaling and recovery.',
        'The exam often gives a business need and asks for the matching benefit: uninterrupted service suggests availability, changing demand suggests scalability or elasticity, and consistent cost/performance planning suggests predictability.'
      ],
      keyPoints: [
        'High availability reduces service interruption, often using redundancy and an SLA target. Disaster recovery restores service after a major event; the concepts overlap but are not identical.',
        'Vertical scaling changes the capacity of one resource; horizontal scaling changes the number of resource instances.',
        'Elasticity automatically or rapidly adds and removes capacity with demand. Scalability is the broader ability to adjust capacity.',
        'Reliability is the ability to recover from failures and continue functioning. Distributed regions, zones, backups, replication, and tested recovery contribute.',
        'Predictability includes performance and cost: autoscaling, consistent service tiers, budgets, calculators, reservations, and monitoring improve planning.',
        'Central policy, templates, identity, logging, and management APIs make governance and repeatable operation possible at scale.'
      ],
      comparison: { title: 'Benefit signals', columns: ['Signal', 'Benefit', 'Typical mechanism'], rows: [
        ['Keep service running through component failure', 'Availability / reliability', 'redundancy, zones, health probes, failover'],
        ['Handle a larger planned workload', 'Scalability', 'scale up or scale out'],
        ['Follow sudden peaks and release capacity afterward', 'Elasticity', 'autoscale rules or serverless scale'],
        ['Estimate future spend and performance', 'Predictability', 'pricing tools, budgets, stable tiers, telemetry'],
        ['Apply standards to many resources', 'Governance / manageability', 'policy, templates, hierarchy, automation']
      ] },
      insight: ['Availability is an outcome; redundancy is one design technique used to achieve it. A single resource with an SLA is not the same as a resilient end-to-end application.'],
      traps: ['Scaling up means a larger instance; scaling out means more instances.', 'Elasticity includes scaling back down, not just adding resources.', 'A provider SLA does not cover application bugs or customer misconfiguration.', 'Cloud security is shared: platform protections do not replace identity, data, and configuration controls.'],
      checklist: ['Differentiate availability and disaster recovery', 'Compare vertical and horizontal scaling', 'Separate scalability and elasticity', 'Explain reliability across failure boundaries', 'Connect governance and management to central controls'],
      recall: [
        { question: 'Which scaling action adds more instances?', answer: 'Horizontal scaling, or scaling out.' },
        { question: 'What distinguishes elasticity?', answer: 'Capacity can expand and contract with demand, often automatically.' },
        { question: 'Does an SLA make an application automatically highly available?', answer: 'No. End-to-end availability also depends on architecture and configuration.' }
      ]
    }),
    lesson({
      id: 'service-types', objectiveId: 'service-types', slug: 'cloud-service-types', title: 'Cloud service types', domainId: 'cloud-concepts',
      summary: 'Choose IaaS, PaaS, SaaS, containers, and serverless by balancing control against operational responsibility.', estimatedMinutes: 15,
      keywords: ['IaaS', 'PaaS', 'SaaS', 'virtual machines', 'App Service', 'containers', 'serverless', 'shared responsibility'],
      blueprintPoints: ['Describe infrastructure as a service', 'Describe platform as a service', 'Describe software as a service', 'Identify use cases for each cloud service type'],
      sourceIds: cloudSources,
      overview: ['Cloud service models describe how much of the technology stack the provider operates. IaaS exposes infrastructure, PaaS provides an application platform, and SaaS delivers a complete application.', 'Choose the highest-level managed service that meets the workload’s control, compatibility, portability, and compliance needs. Less infrastructure work usually means faster delivery, while lower-level services offer more customization.'],
      keyPoints: [
        'With IaaS, the provider runs physical infrastructure and virtualization; the customer manages guest operating systems, patches, middleware, applications, and data.',
        'With PaaS, the provider also runs the OS, runtime, scaling platform, and much of patching; the customer focuses on application code, configuration, identities, and data.',
        'With SaaS, the provider operates the complete application; the customer manages users, access, data, and tenant configuration.',
        'Containers package an application and dependencies but can run on IaaS or managed container PaaS. The packaging format does not alone define the service model.',
        'Serverless is a PaaS-style execution model optimized for events and consumed capacity, with infrastructure and scale abstracted.',
        'Lift-and-shift legacy workloads often begin on IaaS; new web APIs may favor PaaS; business productivity applications are commonly SaaS.'
      ],
      comparison: { title: 'Control versus responsibility', columns: ['Model', 'Customer manages', 'Example need'], rows: [
        ['IaaS', 'guest OS through application and data', 'custom OS or legacy software dependencies'],
        ['PaaS', 'application, configuration, identity, and data', 'deploy code without managing servers'],
        ['SaaS', 'users, access, tenant settings, and business data', 'consume a finished business application'],
        ['Serverless', 'function/workflow logic, triggers, access, and data', 'event-driven work with variable demand']
      ] },
      insight: ['In scenario questions, underline what the team must control. A required custom operating system points to IaaS; “focus on code and avoid OS patching” points to PaaS.'],
      traps: ['PaaS does not remove responsibility for application vulnerabilities, secrets, identities, or data.', 'SaaS customers still configure access and protect their data.', 'A VM is IaaS even when deployed automatically.', 'Containers are not automatically serverless and can require cluster management depending on the service.'],
      checklist: ['Draw the responsibility stack for IaaS, PaaS, and SaaS', 'Map common workload requirements to a model', 'Explain where containers fit', 'Recognize serverless/event-driven requirements', 'Choose based on required control rather than familiarity'],
      recall: [
        { question: 'Who patches the guest OS in IaaS?', answer: 'The customer.' },
        { question: 'Which model lets developers focus mainly on code and data?', answer: 'PaaS.' },
        { question: 'Is a container inherently IaaS or PaaS?', answer: 'No. It can run on services with different management models.' }
      ]
    }),
    lesson({
      id: 'azure-architecture', objectiveId: 'azure-architecture', slug: 'azure-architecture', title: 'Azure architecture and hierarchy', domainId: 'architecture-services',
      summary: 'Navigate regions, region pairs, sovereign geographies, availability zones, subscriptions, resource groups, and management groups.', estimatedMinutes: 18,
      keywords: ['region', 'availability zone', 'region pair', 'geography', 'resource group', 'subscription', 'management group', 'resource hierarchy'],
      blueprintPoints: ['Describe Azure regions and availability zones', 'Describe region pairs and sovereign regions', 'Describe resources and resource groups', 'Describe subscriptions and management groups', 'Describe the hierarchy of resource groups, subscriptions, and management groups'],
      sourceIds: [...serviceSources, 'azure-geographies', 'arm-docs'],
      overview: ['Azure organizes physical infrastructure into geographies, regions, and availability zones, while management scope is organized into resources, resource groups, subscriptions, management groups, and a tenant.', 'Physical failure boundaries and governance scopes solve different problems. Zones improve resilience within a region; management groups let policy and access flow across subscriptions.'],
      keyPoints: [
        'A region is a deployment area containing one or more datacenters. Service availability, price, compliance, latency, and disaster-recovery needs influence region choice.',
        'Availability zones are physically separate datacenter groups within a region with independent power, cooling, and networking. Zonal resources occupy one zone; zone-redundant services spread responsibility across zones.',
        'A resource is a manageable service instance. A resource group is a lifecycle and management container; each resource belongs to one resource group at a time.',
        'A subscription is a billing, quota, and access boundary associated with a Microsoft Entra tenant. Organizations commonly use several subscriptions for environments or business units.',
        'Management groups form a hierarchy above subscriptions so policy and role assignments can inherit downward.',
        'Moving or deleting a resource group affects its resources, so group items with a related lifecycle while using tags for cross-cutting categorization.'
      ],
      comparison: { title: 'Know the scope', columns: ['Scope', 'Primary purpose', 'Contains'], rows: [
        ['Management group', 'govern many subscriptions', 'management groups and subscriptions'],
        ['Subscription', 'billing, quota, and access boundary', 'resource groups and resources'],
        ['Resource group', 'lifecycle and management boundary', 'resources'],
        ['Region', 'physical deployment location', 'datacenters and supported zones'],
        ['Availability zone', 'independent in-region failure boundary', 'zonal infrastructure']
      ] },
      flow: { title: 'Design scopes in the right order', steps: [
        { title: 'Tenant', text: 'Establish the identity boundary in Microsoft Entra ID.' },
        { title: 'Management groups', text: 'Reflect broad governance boundaries and policy inheritance.' },
        { title: 'Subscriptions', text: 'Separate billing, quota, environment, or delegated administration.' },
        { title: 'Resource groups', text: 'Group resources that share lifecycle and management operations.' }
      ] },
      insight: ['Tags organize and report across resource groups; resource groups control lifecycle. Do not create resource groups merely to represent every reporting category.'],
      traps: ['Availability zones are within a region, not separate regions.', 'A resource group can contain resources from different regions, though each resource has its own supported location.', 'A resource can belong to only one resource group at a time.', 'Region pairing does not make every service replicate automatically; the workload must use supported resilience features.'],
      checklist: ['Order the Azure management hierarchy', 'Separate geography, region, and zone', 'Explain zonal versus zone-redundant', 'Choose subscriptions versus resource groups', 'Explain inherited management-group policy'],
      recall: [
        { question: 'What scope sits directly above subscriptions?', answer: 'Management groups.' },
        { question: 'What does an availability zone protect against?', answer: 'Failures affecting a datacenter group within one Azure region.' },
        { question: 'Can one resource be in two resource groups?', answer: 'No.' }
      ]
    }),
    lesson({
      id: 'compute-networking', objectiveId: 'compute-networking', slug: 'compute-and-networking', title: 'Compute and networking', domainId: 'architecture-services',
      summary: 'Select virtual machines, scale sets, App Service, containers, functions, virtual desktops, VNets, connectivity, routing, and load balancing.', estimatedMinutes: 23,
      keywords: ['VM', 'scale set', 'App Service', 'container', 'Functions', 'virtual network', 'VPN', 'ExpressRoute', 'load balancer', 'DNS', 'NSG'],
      blueprintPoints: ['Compare Azure compute types', 'Describe virtual machine options and Azure Virtual Desktop', 'Describe containers, functions, and App Service', 'Describe virtual networks, subnets, peering, DNS, VPN Gateway, and ExpressRoute', 'Describe public and private endpoints'],
      sourceIds: [...serviceSources, 'compute-docs', 'network-docs'],
      overview: ['Azure compute ranges from full guest-OS control to managed application and event platforms. Azure networking provides isolated address spaces, segmentation, name resolution, traffic control, private connectivity, and global or regional delivery.', 'Choose compute by required control and operating model; choose networking by who must connect, whether traffic can traverse the public internet, and where filtering or distribution belongs.'],
      keyPoints: [
        'Virtual machines provide guest-OS control; availability sets distribute VMs across fault/update domains; scale sets operate groups of similar autoscaling VMs.',
        'App Service hosts web apps and APIs without guest-OS management. Azure Functions runs event-triggered code. Container Instances offers simple containers; Azure Kubernetes Service orchestrates complex containerized applications.',
        'Azure Virtual Desktop provides centrally managed Windows desktops and applications to remote users.',
        'A virtual network is an isolated private network. Subnets segment address space; network security groups filter allowed inbound and outbound flows at subnet or interface scopes.',
        'VNet peering privately connects Azure VNets. VPN Gateway encrypts traffic over the public internet; ExpressRoute provides private dedicated connectivity through a provider.',
        'Public endpoints are reachable through public addressing and controls; private endpoints give a supported service a private IP in a VNet. Azure DNS hosts name-resolution zones.'
      ],
      comparison: { title: 'Compute selection', columns: ['Service', 'Choose it for', 'You manage'], rows: [
        ['Virtual Machines', 'custom OS, legacy dependencies, maximum control', 'guest OS, patches, runtime, app'],
        ['VM Scale Sets', 'many similar autoscaling VMs', 'image and guest workload'],
        ['App Service', 'managed web apps and APIs', 'app and configuration'],
        ['Azure Functions', 'event-driven short-running logic', 'function code, triggers, bindings'],
        ['Container Instances', 'simple isolated container execution', 'container image and settings'],
        ['AKS', 'orchestrated multi-container platforms', 'applications plus shared cluster responsibilities'],
        ['Azure Virtual Desktop', 'remote desktops and published apps', 'desktop images, apps, identities, policies']
      ] },
      flow: { title: 'Connectivity choices', steps: [
        { title: 'Inside a VNet', text: 'Use subnets, routes, NSGs, and private IPs.' },
        { title: 'Between VNets', text: 'Use VNet peering or a routed hub design.' },
        { title: 'From on-premises', text: 'Use site-to-site VPN for encrypted internet transit or ExpressRoute for private provider connectivity.' },
        { title: 'To platform services', text: 'Use public endpoints with controls or private endpoints and private DNS where supported.' }
      ] },
      insight: ['Load balancers distribute traffic; autoscalers change capacity. They are complementary but solve different problems.'],
      traps: ['NSGs filter traffic but are not a replacement for every firewall capability.', 'VNet peering is not transitive by default.', 'ExpressRoute is private connectivity, not automatically encryption.', 'Private endpoints need correct DNS so clients resolve the service name to its private address.', 'Azure Functions and App Service are managed compute, while VMs retain guest-OS responsibility.'],
      checklist: ['Choose among VM, scale set, App Service, Functions, ACI, and AKS', 'Describe Azure Virtual Desktop', 'Build a VNet/subnet/NSG mental model', 'Compare peering, VPN, and ExpressRoute', 'Separate endpoints, load balancing, and autoscaling'],
      recall: [
        { question: 'Which connection crosses the internet using encryption?', answer: 'A VPN connection through VPN Gateway.' },
        { question: 'Which compute service is optimized for event-triggered code?', answer: 'Azure Functions.' },
        { question: 'What gives a platform service a private IP in a VNet?', answer: 'A private endpoint.' }
      ]
    }),
    lesson({
      id: 'azure-storage', objectiveId: 'azure-storage', slug: 'azure-storage', title: 'Azure Storage', domainId: 'architecture-services',
      summary: 'Choose storage services, access tiers, redundancy, account types, transfer tools, and migration options.', estimatedMinutes: 21,
      keywords: ['Blob', 'Files', 'Queue', 'Table', 'Disk', 'LRS', 'ZRS', 'GRS', 'GZRS', 'access tier', 'AzCopy', 'Data Box'],
      blueprintPoints: ['Compare Azure Storage services', 'Describe storage tiers and redundancy', 'Describe storage accounts and endpoints', 'Identify file movement options', 'Describe Azure Migrate and Azure Data Box'],
      sourceIds: [...serviceSources, 'storage-docs'],
      overview: ['Azure Storage offers durable object, file, queue, key-value, and disk services. The correct service follows the access pattern: object content, shared file system, message decoupling, NoSQL key/attribute data, or VM block storage.', 'Redundancy controls how many copies exist and across which failure boundaries. Access tiers optimize blob cost according to how frequently and how quickly data is read.'],
      keyPoints: [
        'Blob Storage holds unstructured objects such as documents, images, video, logs, and backups. Containers organize blobs but are not operating-system directories.',
        'Azure Files provides managed SMB or NFS file shares; managed disks provide persistent block storage for Azure VMs; Queue Storage supports asynchronous messages; Table Storage is a schemaless key/attribute store.',
        'LRS copies within one datacenter, ZRS across zones in one region, GRS to a secondary region, and GZRS combines zonal primary protection with geo-replication.',
        'Read-access geo options allow reads from the secondary endpoint before Microsoft initiates a failover; normal GRS/GZRS secondary data is not directly readable.',
        'Hot, cool, cold, and archive blob tiers trade storage cost against access, retrieval time, transaction price, and minimum retention. Archive data must be rehydrated before normal access.',
        'AzCopy and Storage Explorer transfer data; Azure File Sync caches Azure file shares on Windows Server; Data Box moves large offline datasets; Azure Migrate discovers, assesses, and coordinates migrations.'
      ],
      comparison: { title: 'Storage service selection', columns: ['Need', 'Service', 'Interface shape'], rows: [
        ['images, backups, logs, data lake objects', 'Blob Storage', 'object / REST'],
        ['shared folders for applications or users', 'Azure Files', 'SMB or NFS'],
        ['persistent operating-system or data volumes', 'Managed Disks', 'VM block device'],
        ['asynchronous work messages', 'Queue Storage', 'message queue'],
        ['simple massive key/attribute records', 'Table Storage', 'NoSQL key-value'],
        ['petabytes with constrained network bandwidth', 'Azure Data Box', 'offline appliance shipment']
      ] },
      flow: { title: 'Choose redundancy by failure boundary', steps: [
        { title: 'Local hardware', text: 'LRS keeps multiple synchronous copies within one datacenter.' },
        { title: 'Datacenter / zone', text: 'ZRS spreads synchronous copies across availability zones in the primary region.' },
        { title: 'Regional disaster', text: 'GRS or GZRS asynchronously replicates to a paired secondary region.' },
        { title: 'Secondary reads', text: 'Choose RA-GRS or RA-GZRS when read access to the secondary is required before failover.' }
      ] },
      insight: ['Redundancy protects availability and durability; it does not replace backup when you need point-in-time recovery from accidental deletion, corruption, or malicious change.'],
      traps: ['Archive is an offline tier and requires rehydration.', 'Geo-replication is asynchronous, so the newest writes might not exist in the secondary during a sudden regional loss.', 'Blob containers are not the same as containerized applications.', 'A storage account can expose several storage services, each with a distinct endpoint.'],
      checklist: ['Map five core storage services to workloads', 'Order LRS, ZRS, GRS, and GZRS failure boundaries', 'Explain read-access geo redundancy', 'Choose blob access tiers', 'Select online, synchronized, or offline transfer tools'],
      recall: [
        { question: 'Which service offers managed SMB shares?', answer: 'Azure Files.' },
        { question: 'Which redundancy combines zones with a secondary region?', answer: 'GZRS.' },
        { question: 'Which transfer option is designed for very large offline migration?', answer: 'Azure Data Box.' }
      ]
    }),
    lesson({
      id: 'identity-security', objectiveId: 'identity-security', slug: 'identity-access-and-security', title: 'Identity, access, and security', domainId: 'architecture-services',
      summary: 'Connect Microsoft Entra ID, authentication, MFA, Conditional Access, RBAC, Zero Trust, defense in depth, and Defender for Cloud.', estimatedMinutes: 22,
      keywords: ['Microsoft Entra ID', 'authentication', 'authorization', 'MFA', 'Conditional Access', 'RBAC', 'Zero Trust', 'Defender for Cloud', 'defense in depth'],
      blueprintPoints: ['Describe Microsoft Entra ID and Microsoft Entra Domain Services', 'Describe authentication methods and external identities', 'Describe Conditional Access and Azure RBAC', 'Describe Zero Trust and defense in depth', 'Describe Microsoft Defender for Cloud'],
      sourceIds: [...serviceSources, 'entra-docs', 'defender-docs'],
      overview: ['Microsoft Entra ID is Azure’s cloud identity and access service. Authentication proves identity; authorization decides what that identity can do. Azure RBAC authorizes actions on Azure resources through role assignments at a scope.', 'Zero Trust assumes breach and requires explicit verification, least privilege, and continuous attention to signals. Defense in depth uses complementary controls so one failure does not expose the whole system.'],
      keyPoints: [
        'Users, groups, service principals, and managed identities are security principals. Managed identities let Azure resources obtain tokens without application-managed credentials.',
        'Multifactor authentication combines factors such as something known, possessed, or inherent. Passwordless options can improve both resistance and usability.',
        'Conditional Access evaluates signals such as identity, risk, device, location, application, and requested action, then allows, blocks, or requires controls such as MFA.',
        'An RBAC assignment combines a security principal, role definition, and scope. Assign the least-privileged role at the narrowest practical scope.',
        'External identities enable partners, customers, or other tenants to collaborate while retaining suitable identity governance.',
        'Defender for Cloud assesses security posture, gives recommendations and a secure score, and provides workload protection capabilities for supported resources.'
      ],
      comparison: { title: 'Do not mix these controls', columns: ['Control', 'Question answered', 'Example'], rows: [
        ['Authentication', 'Who are you?', 'sign-in with passwordless plus MFA'],
        ['Conditional Access', 'Under these signals, may sign-in continue?', 'require compliant device or block risk'],
        ['Azure RBAC', 'What Azure actions may this principal perform at this scope?', 'Reader on one resource group'],
        ['Resource lock', 'Can an authorized management action delete or modify this resource?', 'CanNotDelete lock'],
        ['Defender for Cloud', 'What posture risks and threats need attention?', 'recommendation or workload alert']
      ] },
      flow: { title: 'A request through identity controls', steps: [
        { title: 'Authenticate', text: 'The identity proves who or what it is and obtains a token.' },
        { title: 'Apply access policy', text: 'Conditional Access evaluates relevant sign-in and session signals.' },
        { title: 'Authorize', text: 'Azure RBAC evaluates role assignments inherited at the requested resource scope.' },
        { title: 'Audit', text: 'Activity and sign-in logs support investigation, governance, and improvement.' }
      ] },
      insight: ['RBAC roles are additive. A deny-like outcome usually comes from another control or a deny assignment; simply adding a narrow role does not remove broader inherited permissions.'],
      traps: ['Authentication and authorization are different stages.', 'Microsoft Entra ID is not the same product as Microsoft Entra Domain Services, which supplies managed domain-join, LDAP, and Kerberos/NTLM capabilities.', 'MFA is a control that Conditional Access can require; they are not synonyms.', 'A Contributor can manage resources but cannot grant Azure RBAC access by default.', 'Zero Trust is a strategy, not one product.'],
      checklist: ['Identify users, groups, service principals, and managed identities', 'Separate authentication, Conditional Access, and authorization', 'Build an RBAC assignment from principal, role, and scope', 'Recall the three Zero Trust principles', 'Describe Defender for Cloud posture and protection'],
      recall: [
        { question: 'What three elements form an RBAC assignment?', answer: 'A security principal, a role definition, and a scope.' },
        { question: 'What does Conditional Access evaluate?', answer: 'Identity and contextual signals to apply an access decision or required control.' },
        { question: 'Why use a managed identity?', answer: 'To let an Azure resource obtain tokens without storing application credentials.' }
      ]
    }),
    lesson({
      id: 'cost-management', objectiveId: 'cost-management', slug: 'cost-management', title: 'Cost management', domainId: 'management-governance',
      summary: 'Estimate, analyze, allocate, alert on, and optimize Azure spend using the right pricing and Cost Management tools.', estimatedMinutes: 17,
      keywords: ['pricing calculator', 'TCO calculator', 'Cost Management', 'budgets', 'tags', 'reservations', 'savings plan', 'egress', 'cost factors'],
      blueprintPoints: ['Describe factors that affect Azure costs', 'Compare the pricing and TCO calculators', 'Describe Cost Management capabilities', 'Describe tags for cost allocation'],
      sourceIds: [...governanceSources, 'cost-docs'],
      overview: ['Azure cost depends on service, SKU, region, consumption, duration, licensing, support, commitments, and network transfer. Cost Management analyzes actual and forecast spend, supports budgets and alerts, and helps allocate costs.', 'Estimation happens before or during planning; analysis and control continue after deployment. Budgets notify or trigger automation but do not automatically stop resources.'],
      keyPoints: [
        'The Pricing calculator estimates Azure service configurations. The TCO calculator compares estimated on-premises costs with an Azure migration scenario.',
        'Region, service tier, instance size, runtime, storage operations, redundancy, data retention, and outbound data transfer can change cost.',
        'Reservations and savings plans exchange usage commitment for lower eligible compute cost; Azure Hybrid Benefit can apply eligible existing Windows Server or SQL Server licenses.',
        'Cost analysis groups and filters spend by subscription, resource group, service, location, tag, or other dimensions. Forecasts project likely spend from current patterns.',
        'Budgets track thresholds and send alerts or invoke action groups; they are not hard spending caps.',
        'Tags attach key-value metadata useful for allocation, ownership, and reporting, but not every resource inherits them automatically and not every cost is taggable.'
      ],
      comparison: { title: 'Use the right cost tool', columns: ['Need', 'Tool or feature', 'When'], rows: [
        ['Estimate a new Azure architecture', 'Pricing calculator', 'planning before deployment'],
        ['Compare on-premises and Azure economics', 'TCO calculator', 'migration business case'],
        ['Inspect actual and forecast spend', 'Cost analysis', 'ongoing operations'],
        ['Notify at thresholds', 'Budgets and alerts', 'ongoing control'],
        ['Find optimization opportunities', 'Azure Advisor cost recommendations', 'ongoing improvement'],
        ['Allocate spend to teams or products', 'Scopes, tags, and cost allocation', 'chargeback/showback']
      ] },
      flow: { title: 'A FinOps feedback loop', steps: [
        { title: 'Estimate', text: 'Model architecture, region, expected use, licensing, and support.' },
        { title: 'Allocate', text: 'Apply scopes, naming, ownership, and tags so spend has an accountable destination.' },
        { title: 'Observe', text: 'Use cost analysis, forecasts, exports, budgets, and anomaly signals.' },
        { title: 'Optimize', text: 'Right-size, schedule, delete waste, tune tiers, and evaluate commitments.' }
      ] },
      insight: ['The cheapest unit price is not always the lowest total cost: operational effort, reliability requirements, transfer, retention, and commitment risk all belong in the decision.'],
      traps: ['Budgets alert; they do not automatically shut down a subscription.', 'Inbound data transfer is often free, while outbound transfer commonly incurs charges; always verify the service and route.', 'Tags do not provide access control.', 'Reservations reduce eligible usage cost but do not necessarily reserve a specific physical machine.'],
      checklist: ['List major cost factors', 'Choose pricing versus TCO calculator', 'Explain analysis, forecast, budget, and alert', 'Describe commitments and licensing benefits', 'Use scopes and tags for allocation'],
      recall: [
        { question: 'Which calculator compares on-premises and cloud costs?', answer: 'The Total Cost of Ownership calculator.' },
        { question: 'Does exceeding a budget stop resources?', answer: 'No. A budget produces alerts or configured actions.' },
        { question: 'What are tags primarily used for in cost management?', answer: 'Metadata-based grouping and allocation such as owner, project, or cost center.' }
      ]
    }),
    lesson({
      id: 'governance-compliance', objectiveId: 'governance-compliance', slug: 'governance-and-compliance', title: 'Governance and compliance', domainId: 'management-governance',
      summary: 'Use Purview, Policy, initiatives, locks, Service Trust Portal, and hierarchy to make standards visible and enforceable.', estimatedMinutes: 19,
      keywords: ['Microsoft Purview', 'Azure Policy', 'initiative', 'resource lock', 'compliance', 'Service Trust Portal', 'governance'],
      blueprintPoints: ['Describe Microsoft Purview', 'Describe Azure Policy and initiatives', 'Describe resource locks', 'Describe the Service Trust Portal', 'Describe governance across management scopes'],
      sourceIds: [...governanceSources, 'governance-docs'],
      overview: ['Governance establishes guardrails for how cloud resources and data are created, configured, classified, and reviewed. Azure Policy evaluates resource properties against rules; Microsoft Purview provides data governance, risk, and compliance capabilities across data estates and Microsoft environments.', 'Controls operate at scopes. Assignments at management groups or subscriptions can inherit downward, while exemptions and exclusions should remain explicit and reviewable.'],
      keyPoints: [
        'Azure Policy definitions express a condition and effect. Effects can audit, deny, append/modify, deploy related configuration, or mark noncompliance depending on the policy.',
        'An initiative groups policy definitions so a broader standard can be assigned and reported as one unit.',
        'Policy can evaluate existing resources and new changes. Some effects require a remediation task and suitable managed identity to correct existing resources.',
        'CanNotDelete locks allow modification but block deletion; ReadOnly locks block management-plane modification and deletion. Locks inherit to child resources.',
        'Microsoft Purview supports data discovery, cataloging, lineage, classification, information protection, data loss prevention, audit, and compliance-related workflows across its solution areas.',
        'The Service Trust Portal provides Microsoft audit reports, compliance documentation, and trust resources to authorized users.'
      ],
      comparison: { title: 'Governance control selection', columns: ['Control', 'Purpose', 'Example'], rows: [
        ['Azure Policy', 'evaluate and enforce resource configuration', 'deny public IP creation'],
        ['Initiative', 'group related policy definitions', 'organization security baseline'],
        ['Azure RBAC', 'authorize management/data actions', 'Reader on subscription'],
        ['Resource lock', 'protect against accidental management changes', 'prevent deletion of production database'],
        ['Microsoft Purview', 'understand and govern data and compliance risk', 'catalog and classify sensitive data'],
        ['Service Trust Portal', 'obtain Microsoft assurance artifacts', 'download audit report']
      ] },
      flow: { title: 'Policy lifecycle', steps: [
        { title: 'Define', text: 'Use a built-in or custom definition with clear conditions and effect.' },
        { title: 'Group', text: 'Combine definitions into an initiative when they represent one standard.' },
        { title: 'Assign', text: 'Choose the management-group, subscription, resource-group, or resource scope and parameters.' },
        { title: 'Review and remediate', text: 'Investigate compliance, create remediation where supported, and govern exemptions.' }
      ] },
      insight: ['RBAC controls who may try an operation; Policy controls whether the resulting resource state is allowed. Many production designs need both.'],
      traps: ['A resource lock can block an Owner because it is evaluated separately from RBAC authorization.', 'ReadOnly locks can affect services that perform management-plane writes even when their data path appears read-only.', 'Policy does not replace identity permissions.', 'Compliance documentation supports assurance but does not make a customer workload compliant automatically.'],
      checklist: ['Separate Policy, RBAC, locks, and Purview', 'Explain definitions, initiatives, assignments, and remediation', 'Compare CanNotDelete and ReadOnly', 'Describe inheritance and exemptions', 'Know what the Service Trust Portal supplies'],
      recall: [
        { question: 'What groups several Azure Policy definitions?', answer: 'An initiative definition.' },
        { question: 'Which lock allows updates but blocks deletion?', answer: 'CanNotDelete.' },
        { question: 'Where can customers find Microsoft audit reports?', answer: 'The Service Trust Portal.' }
      ]
    }),
    lesson({
      id: 'management-deployment', objectiveId: 'management-deployment', slug: 'management-and-deployment', title: 'Management and deployment tools', domainId: 'management-governance',
      summary: 'Choose the portal, Cloud Shell, CLI, PowerShell, Arc, ARM templates, Bicep, and resource-management scopes for repeatable administration.', estimatedMinutes: 20,
      keywords: ['Azure portal', 'Cloud Shell', 'Azure CLI', 'Azure PowerShell', 'Azure Arc', 'ARM', 'Bicep', 'infrastructure as code', 'resource manager'],
      blueprintPoints: ['Describe the Azure portal, Cloud Shell, CLI, and PowerShell', 'Describe Azure Arc', 'Describe infrastructure as code', 'Describe Azure Resource Manager and ARM templates'],
      sourceIds: [...governanceSources, 'arm-docs'],
      overview: ['Azure Resource Manager is the control plane used to deploy and manage Azure resources consistently. The portal, CLI, PowerShell, SDKs, and infrastructure-as-code tools all ultimately interact with resource-provider operations through this management layer.', 'Interactive tools are useful for exploration and one-off work; declarative infrastructure as code makes environments repeatable, reviewable, and less dependent on manual ordering.'],
      keyPoints: [
        'The Azure portal is a graphical management interface. Cloud Shell provides browser-based Bash or PowerShell with common Azure tools and authenticated context.',
        'Azure CLI uses cross-platform command syntax; Azure PowerShell provides PowerShell cmdlets and object pipelines. Both support scripting and automation.',
        'Azure Resource Manager organizes resource providers, scopes, tags, locks, RBAC, and deployments and supports declarative templates.',
        'ARM templates are JSON declarations. Bicep is a concise Azure-specific language compiled to ARM templates. Both describe desired resources and dependencies.',
        'Declarative deployments are designed to be repeatable and idempotent: describe the desired end state rather than hand-coding every imperative step.',
        'Azure Arc projects supported servers, Kubernetes clusters, data services, and other resources outside Azure into Azure’s management and governance plane.'
      ],
      comparison: { title: 'Management interface choice', columns: ['Tool', 'Strength', 'Best use'], rows: [
        ['Azure portal', 'visual discovery and guided configuration', 'learning, inspection, occasional operations'],
        ['Cloud Shell', 'ready authenticated browser shell', 'quick CLI or PowerShell administration'],
        ['Azure CLI', 'portable command-line scripting', 'cross-platform automation'],
        ['Azure PowerShell', 'PowerShell objects and pipeline integration', 'PowerShell-centric administration'],
        ['Bicep / ARM templates', 'declarative repeatable environments', 'version-controlled infrastructure delivery'],
        ['Azure Arc', 'Azure management for non-Azure resources', 'hybrid and multicloud governance']
      ] },
      flow: { title: 'An infrastructure-as-code delivery path', steps: [
        { title: 'Declare', text: 'Describe resources, parameters, outputs, dependencies, and modules in Bicep or ARM JSON.' },
        { title: 'Review', text: 'Use source control, validation, and a what-if preview to inspect intended changes.' },
        { title: 'Deploy', text: 'Submit the deployment at the required tenant, management-group, subscription, or resource-group scope.' },
        { title: 'Reconcile', text: 'Resource Manager orders dependencies and converges supported resources toward the declaration.' }
      ] },
      insight: ['CLI and PowerShell are interfaces; ARM is the management layer. A script can be repeatable, but declarative templates describe state and let the platform resolve dependencies.'],
      traps: ['Azure Arc does not move every connected resource into an Azure datacenter.', 'Bicep is not a separate deployment engine; it compiles to ARM template deployments.', 'A resource group is not the only possible deployment scope.', 'Imperative commands specify actions; declarative templates specify the intended state.'],
      checklist: ['Compare portal, Cloud Shell, CLI, and PowerShell', 'Explain ARM control-plane responsibilities', 'Compare ARM JSON and Bicep', 'Describe declarative/idempotent deployment', 'Identify Azure Arc hybrid use cases'],
      recall: [
        { question: 'What does Bicep compile into?', answer: 'An Azure Resource Manager template.' },
        { question: 'Which service extends Azure management to supported resources outside Azure?', answer: 'Azure Arc.' },
        { question: 'What is the key idea of declarative deployment?', answer: 'Describe the desired end state rather than a sequence of manual steps.' }
      ]
    }),
    lesson({
      id: 'monitoring', objectiveId: 'monitoring', slug: 'monitoring-and-service-health', title: 'Monitoring and service health', domainId: 'management-governance',
      summary: 'Distinguish Advisor, Service Health, Resource Health, Azure Monitor, Log Analytics, alerts, Application Insights, and metrics.', estimatedMinutes: 19,
      keywords: ['Azure Advisor', 'Service Health', 'Resource Health', 'Azure Monitor', 'Log Analytics', 'Application Insights', 'metrics', 'logs', 'alerts'],
      blueprintPoints: ['Describe Azure Advisor', 'Describe Azure Service Health', 'Describe Azure Monitor', 'Describe Log Analytics, alerts, and Application Insights'],
      sourceIds: [...governanceSources, 'monitor-docs'],
      overview: ['Azure operations combine recommendations, platform-status communication, resource-specific health, and workload telemetry. Azure Advisor recommends improvements; Service Health communicates Azure service events relevant to you; Azure Monitor collects and analyzes metrics, logs, traces, and changes.', 'Monitoring becomes useful when telemetry has an owner and action: a dashboard informs, an alert evaluates a condition and notifies or triggers automation, and an investigation connects symptoms across resources and applications.'],
      keyPoints: [
        'Azure Advisor analyzes deployed configurations and usage to recommend improvements across reliability, security, performance, operational excellence, and cost.',
        'Azure Status is a broad public status view. Service Health gives personalized service issues, planned maintenance, and health advisories. Resource Health reports the current and historical health of an individual resource.',
        'Azure Monitor Metrics stores numeric time-series values suited to fast charts and alerting; Azure Monitor Logs stores structured records queried with Kusto Query Language in Log Analytics.',
        'Log Analytics is the Azure portal experience for querying and analyzing log data in a Log Analytics workspace.',
        'Alert rules evaluate metric, log, activity, or other signals. Action groups define notification and automation targets.',
        'Application Insights is Azure Monitor’s application performance monitoring capability for requests, dependencies, exceptions, traces, availability, and distributed transaction views.'
      ],
      comparison: { title: 'Operational question to tool', columns: ['Question', 'Tool', 'Result'], rows: [
        ['How can this resource be improved?', 'Azure Advisor', 'prioritized recommendation'],
        ['Is Azure having an issue relevant to my subscription?', 'Service Health', 'personalized incident or maintenance notice'],
        ['Is this one VM or database currently healthy?', 'Resource Health', 'resource availability state and history'],
        ['What does telemetry show across the environment?', 'Azure Monitor', 'metrics, logs, traces, alerts, insights'],
        ['Why is this application request slow?', 'Application Insights', 'request and dependency telemetry'],
        ['Find matching events across log records', 'Log Analytics', 'KQL query results']
      ] },
      flow: { title: 'From signal to response', steps: [
        { title: 'Collect', text: 'Enable suitable platform, resource, guest, network, and application telemetry.' },
        { title: 'Analyze', text: 'Chart metrics, query logs, correlate traces, and create workbooks or dashboards.' },
        { title: 'Alert', text: 'Define a meaningful threshold or query, evaluation window, severity, and action group.' },
        { title: 'Improve', text: 'Investigate root cause, automate safe responses, and refine telemetry and thresholds.' }
      ] },
      insight: ['Metrics answer “how much or how many over time?” efficiently. Logs answer richer “which events, properties, and relationships?” questions. Many investigations start with a metric alert and continue in logs and traces.'],
      traps: ['Advisor recommendations are not incident alerts.', 'Service Health is personalized; Azure Status is the broad public page.', 'Log Analytics is an analysis experience, while a Log Analytics workspace stores collected log data.', 'Application Insights focuses on application behavior and is part of Azure Monitor.', 'Collecting data does not automatically notify anyone; an alert rule and action group are needed.'],
      checklist: ['Separate Advisor, Status, Service Health, and Resource Health', 'Compare metrics and logs', 'Describe workspaces and Log Analytics', 'Build alert rule plus action group', 'Identify Application Insights telemetry'],
      recall: [
        { question: 'Which service reports incidents affecting your subscriptions and regions?', answer: 'Azure Service Health.' },
        { question: 'Which telemetry is best for fast numeric time-series alerting?', answer: 'Azure Monitor Metrics.' },
        { question: 'What does an action group define?', answer: 'The notification or automation targets used when an alert fires.' }
      ]
    })
  ]
};
