const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/kasir/KasirClient.tsx', 'utf8');

const index = code.lastIndexOf('Bayar');
if (index > -1) {
  const goodEnd = `Bayar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
`;
  code = code.substring(0, index) + goodEnd;
  fs.writeFileSync('src/app/(dashboard)/kasir/KasirClient.tsx', code);
  console.log("Fixed!");
}
