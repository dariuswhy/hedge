export interface HedgePool {
  id: string
  name: string
  strategy: string
  description: string
  total_capital: number
  current_value: number
  target_return: string
  status: 'active' | 'closed' | 'rebalancing'
  created_at: string
  members?: HedgePoolMember[]
  trades?: HedgePoolTrade[]
}

export interface HedgePoolMember {
  id: string
  pool_id: string
  user_id: string
  allocated_amount: number
  split_percentage: number
  current_member_value: number
  joined_at: string
  profile?: {
    full_name: string
    email: string
  }
}

export interface HedgePoolTrade {
  id: string
  pool_id: string
  asset_symbol: string
  trade_type: 'BUY_LONG' | 'SELL_SHORT' | 'PROFIT_TAKE' | 'STOP_LOSS'
  position_size: number
  entry_price?: number
  exit_price?: number
  pnl_amount: number
  notes?: string
  created_at: string
}

// Calculate Free Unallocated Capital for a specific user across all active hedge pools
export function getUnallocatedFreeCapital(
  userId: string,
  pools: HedgePool[],
  totalUserCapital: number
): { allocated: number; free: number } {
  let allocated = 0
  for (const pool of pools) {
    if (pool.members) {
      const memberRow = pool.members.find(m => m.user_id === userId)
      if (memberRow) {
        allocated += Number(memberRow.allocated_amount || 0)
      }
    }
  }

  const free = Math.max(0, totalUserCapital - allocated)
  return { allocated, free }
}

export const FALLBACK_POOLS: HedgePool[] = [
  {
    id: 'pool-tech-alpha',
    name: 'Quantum Tech Growth Pool',
    strategy: 'High-Growth Tech & AI Long/Short',
    description: 'Concentrated exposure to top AI infra, semiconductor leaders, and SaaS scale-ups with risk hedging.',
    total_capital: 350000,
    current_value: 412500,
    target_return: '+22.5% APY',
    status: 'active',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    members: [
      {
        id: 'pm-1',
        pool_id: 'pool-tech-alpha',
        user_id: 'user-demo-1',
        allocated_amount: 140000,
        split_percentage: 40.0,
        current_member_value: 165000,
        joined_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        profile: { full_name: 'Alexander Wright', email: 'alex@investment.io' }
      },
      {
        id: 'pm-2',
        pool_id: 'pool-tech-alpha',
        user_id: 'user-demo-2',
        allocated_amount: 105000,
        split_percentage: 30.0,
        current_member_value: 123750,
        joined_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        profile: { full_name: 'Sophia Chen', email: 'sophia@chenholdings.com' }
      },
      {
        id: 'pm-3',
        pool_id: 'pool-tech-alpha',
        user_id: 'user-demo-3',
        allocated_amount: 70000,
        split_percentage: 20.0,
        current_member_value: 82500,
        joined_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        profile: { full_name: 'Marcus Vance', email: 'marcus@vancecap.com' }
      },
      {
        id: 'pm-4',
        pool_id: 'pool-tech-alpha',
        user_id: 'user-demo-4',
        allocated_amount: 35000,
        split_percentage: 10.0,
        current_member_value: 41250,
        joined_at: new Date(Date.now() - 90 * 86400000).toISOString(),
        profile: { full_name: 'Elena Rostova', email: 'elena@rostova.de' }
      }
    ],
    trades: [
      {
        id: 'tr-1',
        pool_id: 'pool-tech-alpha',
        asset_symbol: 'NVDA',
        trade_type: 'BUY_LONG',
        position_size: 150000,
        entry_price: 110.50,
        exit_price: 132.80,
        pnl_amount: 30316.74,
        notes: 'Long AI accelerator breakout position.',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString()
      },
      {
        id: 'tr-2',
        pool_id: 'pool-tech-alpha',
        asset_symbol: 'MSFT',
        trade_type: 'PROFIT_TAKE',
        position_size: 100000,
        entry_price: 420.00,
        exit_price: 452.00,
        pnl_amount: 7619.00,
        notes: 'Partial profit take on cloud earnings surprise.',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ]
  },
  {
    id: 'pool-macro-yield',
    name: 'Macro Arbitrage & Options Hedge',
    strategy: 'Delta-Neutral Volatility Harvesting',
    description: 'Systematic volatility skew harvesting combined with short-duration treasury yield overlay.',
    total_capital: 200000,
    current_value: 228000,
    target_return: '+14.0% APY',
    status: 'active',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    members: [
      {
        id: 'pm-5',
        pool_id: 'pool-macro-yield',
        user_id: 'user-demo-1',
        allocated_amount: 100000,
        split_percentage: 50.0,
        current_member_value: 114000,
        joined_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        profile: { full_name: 'Alexander Wright', email: 'alex@investment.io' }
      },
      {
        id: 'pm-6',
        pool_id: 'pool-macro-yield',
        user_id: 'user-demo-2',
        allocated_amount: 60000,
        split_percentage: 30.0,
        current_member_value: 68400,
        joined_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        profile: { full_name: 'Sophia Chen', email: 'sophia@chenholdings.com' }
      },
      {
        id: 'pm-7',
        pool_id: 'pool-macro-yield',
        user_id: 'user-demo-3',
        allocated_amount: 40000,
        split_percentage: 20.0,
        current_member_value: 45600,
        joined_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        profile: { full_name: 'Marcus Vance', email: 'marcus@vancecap.com' }
      }
    ],
    trades: [
      {
        id: 'tr-3',
        pool_id: 'pool-macro-yield',
        asset_symbol: 'BTC-USD',
        trade_type: 'SELL_SHORT',
        position_size: 50000,
        entry_price: 68500,
        exit_price: 63200,
        pnl_amount: 3868.60,
        notes: 'Options delta hedge against macro rate decision.',
        created_at: new Date(Date.now() - 8 * 86400000).toISOString()
      }
    ]
  }
]

export async function fetchAllHedgePoolsWithClient(supabase: any): Promise<HedgePool[]> {
  try {
    const { data: pools, error: poolsError } = await supabase
      .from('hedge_pools')
      .select('*')
      .order('created_at', { ascending: false })

    if (poolsError || !pools || pools.length === 0) {
      return []
    }

    const poolsWithDetails = await Promise.all(
      pools.map(async (pool: any) => {
        const { data: members } = await supabase
          .from('hedge_pool_members')
          .select('*, profile:profiles(full_name, email)')
          .eq('pool_id', pool.id)

        const { data: trades } = await supabase
          .from('hedge_pool_trades')
          .select('*')
          .eq('pool_id', pool.id)
          .order('created_at', { ascending: false })

        return {
          ...pool,
          members: members || [],
          trades: trades || []
        }
      })
    )

    return poolsWithDetails
  } catch {
    return []
  }
}

export async function fetchUserHedgePoolsWithClient(supabase: any, userId: string): Promise<HedgePool[]> {
  try {
    const { data: memberRows, error: memberError } = await supabase
      .from('hedge_pool_members')
      .select('pool_id')
      .eq('user_id', userId)

    if (memberError || !memberRows || memberRows.length === 0) {
      return []
    }

    const poolIds = memberRows.map((m: any) => m.pool_id)
    const { data: pools } = await supabase
      .from('hedge_pools')
      .select('*')
      .in('id', poolIds)

    if (!pools || pools.length === 0) return []

    const userPools = await Promise.all(
      pools.map(async (pool: any) => {
        const { data: members } = await supabase
          .from('hedge_pool_members')
          .select('*, profile:profiles(full_name, email)')
          .eq('pool_id', pool.id)

        const { data: trades } = await supabase
          .from('hedge_pool_trades')
          .select('*')
          .eq('pool_id', pool.id)
          .order('created_at', { ascending: false })

        return {
          ...pool,
          members: members || [],
          trades: trades || []
        }
      })
    )

    return userPools
  } catch {
    return []
  }
}
